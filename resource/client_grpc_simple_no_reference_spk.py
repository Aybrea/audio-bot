#!/usr/bin/env python3

"""
Simplified streaming TTS client for synthesizing given text using Triton Inference Server.
This version uses cached speaker info and does not require reference audio/text.
Supports text splitting and real-time audio stream reception with concurrent processing.

Usage:
# Basic streaming synthesis with cached speaker info
python3 client_grpc_simple_no_reference_spk.py \
    --server-addr localhost \
    --model-name cosyvoice2 \
    --target-text "Long text with multiple sentences. Each will be split. And synthesized with streaming!" \
    --output-path output.wav \
    --min-words 5 \
    --max-words 20
"""

import argparse
import asyncio
import functools
import logging
import queue
import random
import re
import time
import uuid
from typing import List, Tuple

import numpy as np
import soundfile as sf
import tritonclient.grpc as grpcclient_sync
from tritonclient.utils import np_to_triton_dtype, InferenceServerException
import ipdb

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s'
)


class UserData:
    """User data for streaming inference callback"""
    def __init__(self):
        self._completed_requests = queue.Queue()
        self._first_chunk_time = None
        self._start_time = None

    def record_start_time(self):
        self._start_time = time.time()

    def get_first_chunk_latency(self):
        if self._first_chunk_time and self._start_time:
            return self._first_chunk_time - self._start_time
        return None


def callback(user_data, result, error):
    """Callback for streaming inference"""
    if user_data._first_chunk_time is None and not error:
        user_data._first_chunk_time = time.time()
    if error:
        user_data._completed_requests.put(error)
    else:
        user_data._completed_requests.put(result)


def split_text_by_punctuation(text: str, min_words: int = 10, max_words: int = 30) -> List[str]:
    """
    Split text at punctuation marks with min_words and max_words constraints.
    
    Args:
        text: Input text to split
        min_words: Minimum number of words per segment
        max_words: Maximum number of words per segment
        
    Returns:
        List of text segments
    """
    # Split by sentence-ending punctuation while keeping the punctuation
    sentences = re.split(r'([,.:;!?。，！？；：])', text)
    # ipdb.set_trace()
    segments = []
    current_segment = []
    current_word_count = 0
    
    i = 0
    while i < len(sentences):
        part = sentences[i].strip()
        
        if not part:
            i += 1
            continue
            
        # Check if it's punctuation
        if re.match(r'^[,.:;!?。，！？；：]$', part):
            if current_segment:
                current_segment.append(part)
            i += 1
            continue
        
        # Count words in this part
        # For English, split by spaces; for Chinese, each character is a word  
        if re.search(r'[\u4e00-\u9fff]', part):  # Chinese characters
            word_count = len(part)
        else:
            words = part.split()
            word_count = len(words)
        
        # If adding this would exceed max_words and we have min_words, start new segment
        if current_word_count > 0 and current_word_count + word_count > max_words and current_word_count >= min_words:
            segments.append(' '.join(current_segment))
            current_segment = [part]
            current_word_count = word_count
        else:
            current_segment.append(part)
            current_word_count += word_count
            
            # If we hit a sentence-ending punctuation and meet min_words, consider splitting
            if i + 1 < len(sentences) and re.match(r'^[.!?。！？]$', sentences[i + 1].strip()):
                if current_word_count >= min_words:
                    # Add the punctuation
                    current_segment.append(sentences[i + 1].strip())
                    segments.append(' '.join(current_segment))
                    current_segment = []
                    current_word_count = 0
                    i += 1  # Skip the punctuation as we've added it
        
        i += 1
    
    # Add remaining segment if any
    if current_segment:
        segments.append(' '.join(current_segment))
    
    return [s.strip() for s in segments if s.strip()]


def prepare_request_input_output(
    protocol_client,
    target_text: str,
):
    """Prepares inputs for Triton streaming inference with cached speaker info."""
    # Create input tensors - only target_text is needed with spk2info cache
    inputs = [
        protocol_client.InferInput("target_text", [1, 1], "BYTES"),
    ]

    input_data_numpy = np.array([target_text], dtype=object)
    input_data_numpy = input_data_numpy.reshape((1, 1))
    inputs[0].set_data_from_numpy(input_data_numpy)

    outputs = [protocol_client.InferRequestedOutput("waveform")]
    
    logging.info(f"Using spk2info cache, inputs: {[inp.name() for inp in inputs]}")
    return inputs, outputs


def run_sync_streaming_inference(
    sync_triton_client: grpcclient_sync.InferenceServerClient,
    model_name: str,
    inputs: list,
    outputs: list,
    request_id: str,
    user_data: UserData,
    chunk_overlap_duration: float,
    save_sample_rate: int,
    segment_id: int = 0,
) -> Tuple[np.ndarray, float, float]:
    """Run synchronous streaming inference and receive audio chunks in real-time"""
    start_time_total = time.time()
    user_data.record_start_time()

    # Establish stream
    sync_triton_client.start_stream(callback=functools.partial(callback, user_data))

    # Send request
    sync_triton_client.async_stream_infer(
        model_name,
        inputs,
        request_id=request_id,
        outputs=outputs,
        enable_empty_final_response=True,
    )

    # Process results in real-time
    audios = []
    chunk_count = 0
    while True:
        try:
            result = user_data._completed_requests.get(timeout=30)
            if isinstance(result, InferenceServerException):
                logging.error(f"[Segment {segment_id}] RPC error: {result}")
                sync_triton_client.stop_stream()
                return None, None, None

            response = result.get_response()
            final = response.parameters["triton_final_response"].bool_param
            if final is True:
                break

            audio_chunk = result.as_numpy("waveform").reshape(-1)
            if audio_chunk.size > 0:
                chunk_count += 1
                audios.append(audio_chunk)
                
                # Log real-time chunk reception
                if chunk_count == 1:
                    first_chunk_latency = user_data.get_first_chunk_latency()
                    logging.info(f"[Segment {segment_id}] 🎯 First chunk received! "
                               f"Latency: {first_chunk_latency:.3f}s (TTFB), "
                               f"size: {len(audio_chunk)} samples")
                else:
                    logging.info(f"[Segment {segment_id}] Chunk {chunk_count} received, "
                               f"size: {len(audio_chunk)} samples, "
                               f"total so far: {sum(len(a) for a in audios)} samples")

        except queue.Empty:
            logging.error(f"[Segment {segment_id}] Timeout waiting for response")
            sync_triton_client.stop_stream()
            return None, None, None

    sync_triton_client.stop_stream()
    end_time_total = time.time()
    total_request_latency = end_time_total - start_time_total
    first_chunk_latency = user_data.get_first_chunk_latency()

    # Reconstruct audio
    if audios:
        if model_name == "spark_tts":
            # Use cross-fade for spark_tts
            cross_fade_samples = int(chunk_overlap_duration * save_sample_rate)
            fade_out = np.linspace(1, 0, cross_fade_samples)
            fade_in = np.linspace(0, 1, cross_fade_samples)
            
            if len(audios) == 1:
                reconstructed_audio = audios[0]
            else:
                reconstructed_audio = audios[0][:-cross_fade_samples]
                for i in range(1, len(audios)):
                    cross_faded_overlap = (audios[i][:cross_fade_samples] * fade_in +
                                         audios[i - 1][-cross_fade_samples:] * fade_out)
                    middle_part = audios[i][cross_fade_samples:-cross_fade_samples]
                    reconstructed_audio = np.concatenate([reconstructed_audio, cross_faded_overlap, middle_part])
                reconstructed_audio = np.concatenate([reconstructed_audio, audios[-1][-cross_fade_samples:]])
        else:
            reconstructed_audio = np.concatenate(audios)
        
        logging.info(f"[Segment {segment_id}] ✓ Synthesis completed in {total_request_latency:.3f}s, "
                   f"total audio: {len(reconstructed_audio)} samples, chunks: {chunk_count}")
    else:
        reconstructed_audio = np.array([], dtype=np.float32)

    return reconstructed_audio, total_request_latency, first_chunk_latency


async def synthesize_streaming(
    server_url: str,
    model_name: str,
    target_text: str,
    segment_id: int,
    chunk_overlap_duration: float = 0.1,
    save_sample_rate: int = 24000,
) -> Tuple[np.ndarray, float, float]:
    """Synthesize audio using streaming mode with real-time chunk reception"""
    sync_triton_client = None
    try:
        sync_triton_client = grpcclient_sync.InferenceServerClient(url=server_url, verbose=False)
        
        inputs, outputs = prepare_request_input_output(
            grpcclient_sync,
            target_text,
        )
        
        request_id = str(uuid.uuid4())
        user_data = UserData()
        
        audio, total_latency, first_chunk_latency = await asyncio.to_thread(
            run_sync_streaming_inference,
            sync_triton_client,
            model_name,
            inputs,
            outputs,
            request_id,
            user_data,
            chunk_overlap_duration,
            save_sample_rate,
            segment_id,
        )
        
        return audio, total_latency, first_chunk_latency
        
    finally:
        if sync_triton_client:
            sync_triton_client.close()


async def synthesize_with_splitting(
    args,
    target_text: str,
) -> Tuple[np.ndarray, float, dict]:
    """Synthesize with text splitting and concurrent streaming"""
    segments = split_text_by_punctuation(target_text, args.min_words, args.max_words)
    
    logging.info(f"Text split into {len(segments)} segments:")
    for i, seg in enumerate(segments):
        logging.info(f"  Segment {i}: {seg}")
    
    overall_start_time = time.time()
    results = {}
    
    async def synthesize_segment(segment_id: int, segment_text: str):
        """Synthesize a single segment with streaming"""
        logging.info(f"[Segment {segment_id}] Starting streaming synthesis: '{segment_text[:50]}...'")
        
        try:
            audio, total_latency, first_chunk_latency = await synthesize_streaming(
                f"{args.server_addr}:{args.server_port}",
                args.model_name,
                segment_text,
                segment_id,
                args.chunk_overlap_duration,
                args.target_sr,
            )
            return (segment_id, audio, total_latency, first_chunk_latency)
                
        except Exception as e:
            logging.error(f"[Segment {segment_id}] Failed: {str(e)}")
            raise
    
    # Launch tasks concurrently
    tasks = []
    for i, segment_text in enumerate(segments):
        if i > 0:
            delay = random.uniform(1.0, 2.0)
            logging.info(f"[Segment {i}] Simulating LLM generation delay: {delay:.2f}s...")
            await asyncio.sleep(delay)
        task = asyncio.create_task(synthesize_segment(i, segment_text))
        tasks.append(task)
    
    logging.info(f"All {len(tasks)} streaming synthesis tasks launched...")
    
    # Wait for all tasks
    completed_results = await asyncio.gather(*tasks, return_exceptions=True)
    
    # Process results
    total_first_chunk_latency = 0
    successful_segments = 0
    for result in completed_results:
        if isinstance(result, Exception):
            logging.error(f"Synthesis task failed: {result}")
            continue
        segment_id, audio_bytes, total_latency, first_chunk_latency = result
        results[segment_id] = audio_bytes
        if first_chunk_latency:
            total_first_chunk_latency += first_chunk_latency
            successful_segments += 1
    
    # Combine audio in order
    logging.info("Combining audio segments in chronological order...")
    combined_audio = []
    for i in range(len(segments)):
        if i in results:
            combined_audio.append(results[i])
            logging.info(f"  Added segment {i} to final audio ({len(results[i])} samples)")
        else:
            logging.error(f"  Missing audio for segment {i}")
    
    if combined_audio:
        final_audio = np.concatenate(combined_audio)
    else:
        final_audio = np.array([], dtype=np.float32)
    
    total_time = time.time() - overall_start_time
    avg_first_chunk_latency = total_first_chunk_latency / successful_segments if successful_segments > 0 else 0
    
    stats = {
        'total_time': total_time,
        'num_segments': len(segments),
        'avg_first_chunk_latency': avg_first_chunk_latency
    }
    
    return final_audio, total_time, stats


async def main():
    parser = argparse.ArgumentParser(
        description='Streaming TTS client with cached speaker info (no reference audio/text needed)',
        formatter_class=argparse.ArgumentDefaultsHelpFormatter
    )
    
    # Server settings
    parser.add_argument('--server-addr', type=str, default='speechlab-tunnel.southeastasia.cloudapp.azure.com', help='Server address')
    parser.add_argument('--server-port', type=int, default=8001, help='Server gRPC port')
    parser.add_argument('--model-name', type=str, default='cosyvoice2',
                       choices=['f5_tts', 'spark_tts', 'cosyvoice2'],
                       help='Model name')
    
    # Audio settings
    parser.add_argument('--target-text', default='Please call the DBS lost and stolen hotline. You will need your NRIC for verification.', type=str, help='Text to synthesize')
    parser.add_argument('--output-path', type=str, default='output_DBS_yizhou.wav',
                       help='Output audio file path')
    parser.add_argument('--target-sr', type=int, default=24000,
                       help='Target sample rate (24000 for cosyvoice2, 16000 for spark_tts)')
    
    # Streaming settings
    parser.add_argument('--chunk-overlap-duration', type=float, default=0.1,
                       help='Chunk overlap duration for streaming (seconds)')
    
    # Text splitting settings
    parser.add_argument('--min-words', type=int, default=10,
                       help='Minimum words per segment when splitting')
    parser.add_argument('--max-words', type=int, default=30,
                       help='Maximum words per segment when splitting')
    
    args = parser.parse_args()
    
    start_time = time.time()
    
    # Synthesize with text splitting and streaming
    logging.info(f"\n{'='*60}")
    logging.info("Starting streaming synthesis with cached speaker info...")
    logging.info(f"{'='*60}\n")
    
    final_audio, total_time, stats = await synthesize_with_splitting(
        args, args.target_text
    )
    
    # Save audio
    if final_audio is not None and len(final_audio) > 0:
        sf.write(args.output_path, final_audio, args.target_sr)
        duration = len(final_audio) / args.target_sr
        total_time = time.time() - start_time
        rtf = total_time / duration
        
        logging.info(f"\n{'='*60}")
        logging.info("✓ Synthesis completed successfully!")
        logging.info(f"{'='*60}")
        logging.info(f"  Total time: {total_time:.2f}s")
        logging.info(f"  Segments processed: {stats['num_segments']}")
        logging.info(f"  Average first chunk latency: {stats['avg_first_chunk_latency']:.3f}s")
        logging.info(f"  Audio saved to: {args.output_path}")
        logging.info(f"  Audio duration: {duration:.2f}s")
        logging.info(f"  Real-time factor: {rtf:.3f}")
        logging.info(f"{'='*60}\n")
    else:
        logging.error("\n✗ Failed to synthesize audio")


if __name__ == "__main__":
    asyncio.run(main())

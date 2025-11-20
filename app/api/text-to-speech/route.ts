import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const text = formData.get("text") as string;
    const voiceSample = formData.get("voiceSample") as Blob;

    if (!text) {
      return NextResponse.json({ error: "缺少文本内容" }, { status: 400 });
    }

    // TODO: 替换为你选择的TTS服务
    // 下面是几个常见TTS服务的示例

    // 示例1: Fish Audio API (支持中文语音克隆)
    /*
    const fishFormData = new FormData();
    fishFormData.append("text", text);
    fishFormData.append("reference_audio", voiceSample);

    const response = await fetch("https://api.fish.audio/v1/tts", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.FISH_AUDIO_API_KEY}`,
      },
      body: fishFormData,
    });

    if (!response.ok) throw new Error("TTS生成失败");

    const audioBuffer = await response.arrayBuffer();
    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
      },
    });
    */

    // 示例2: ElevenLabs API
    /*
    // 首先需要克隆声音创建voice_id
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": process.env.ELEVENLABS_API_KEY!,
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
      }),
    });

    const audioBuffer = await response.arrayBuffer();
    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
      },
    });
    */

    // 示例3: 临时返回空音频，用于测试
    // 实际使用时请替换为真实的TTS服务
    console.log("TTS请求:", { text: text.substring(0, 50) + "...", hasVoiceSample: !!voiceSample });

    return NextResponse.json(
      { error: "TTS服务未配置，请在 app/api/text-to-speech/route.ts 中配置你的TTS服务" },
      { status: 501 }
    );
  } catch (error) {
    console.error("TTS生成失败:", error);

    return NextResponse.json({ error: "TTS生成失败" }, { status: 500 });
  }
}

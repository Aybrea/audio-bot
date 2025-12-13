import { Card, CardBody } from "@heroui/card";

import { title } from "@/components/primitives";

export default function RazePage() {
  return (
    <section className="flex flex-col items-center gap-4 md:gap-6 py-4 md:py-8 px-2 md:px-4">
      <div className="inline-block max-w-xl text-center">
        <h1 className={title({ color: "pink" })}>蕾塞之舞</h1>
        <p className="mt-2 md:mt-4 text-sm md:text-base text-default-600">
          Chainsaw Man - Reze Dance
        </p>
      </div>

      <div className="w-full md:w-auto h-auto md:h-[calc(100vh-12rem)]">
        <Card className="overflow-hidden h-auto md:h-full">
          <CardBody className="p-0 h-auto md:h-full flex items-center justify-center">
            <video
              className="w-full h-auto md:h-full md:w-auto max-h-full"
              controls
              preload="metadata"
            >
              <source src="/video/Chainsaw-Man-RezeDance.mp4" type="video/mp4" />
              您的浏览器不支持视频播放。
            </video>
          </CardBody>
        </Card>
      </div>
    </section>
  );
}

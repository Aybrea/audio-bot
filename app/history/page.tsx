import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";

import { title } from "@/components/primitives";

interface WikiPage {
  title: string;
  extract: string;
  thumbnail?: {
    source: string;
    width: number;
    height: number;
  };
  originalimage?: {
    source: string;
    width: number;
    height: number;
  };
  content_urls?: {
    desktop?: {
      page: string;
    };
  };
}

interface HistoryEvent {
  year: number;
  text: string;
  pages: WikiPage[];
}

interface HistoryData {
  events?: HistoryEvent[];
  births?: HistoryEvent[];
  deaths?: HistoryEvent[];
  selected?: HistoryEvent[];
}

async function getHistoryData() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  try {
    const response = await fetch(
      `https://zh.wikipedia.org/api/rest_v1/feed/onthisday/all/${month}/${day}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; HistoryApp/1.0)",
          "Api-User-Agent": "HistoryApp/1.0 (contact@example.com)",
        },
        next: { revalidate: 3600 }, // Revalidate every hour
      },
    );

    if (!response.ok) {
      throw new Error("Failed to fetch history data");
    }

    const data: HistoryData = await response.json();

    return { data, month, day, error: null };
  } catch (error) {
    return {
      data: null,
      month,
      day,
      error: error instanceof Error ? error.message : "An error occurred",
    };
  }
}

function formatDate(month: number, day: number) {
  const months = [
    "一月",
    "二月",
    "三月",
    "四月",
    "五月",
    "六月",
    "七月",
    "八月",
    "九月",
    "十月",
    "十一月",
    "十二月",
  ];

  return `${months[month - 1]}${day}日`;
}

export default async function HistoryPage() {
  const { data, month, day, error } = await getHistoryData();

  if (error) {
    return (
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <h1 className={title({ color: "pink" })}>历史上的今天</h1>
        <Card className="max-w-2xl">
          <CardBody>
            <p className="text-danger">错误: {error}</p>
          </CardBody>
        </Card>
      </section>
    );
  }

  return (
    <section className="flex flex-col items-center gap-4 md:gap-6 py-4 md:py-8 px-2 md:px-4">
      <div className="inline-block max-w-xl text-center">
        <h1 className={title({ color: "pink" })}>历史上的今天</h1>
        <p className="mt-2 md:mt-4 text-lg md:text-xl font-semibold text-default-600">
          {formatDate(month, day)}
        </p>
      </div>

      <div className="w-full max-w-4xl space-y-6">
        {/* Selected/Featured Events */}
        {data?.selected && data.selected.length > 0 && (
          <div>
            <h2 className="text-xl md:text-2xl font-bold mb-4 text-danger">
              精选事件
            </h2>
            <div className="space-y-4">
              {data.selected.slice(0, 3).map((event, index) => {
                // Try to find a page with an image
                const pageWithImage = event.pages?.find(
                  (p) => p.thumbnail || p.originalimage,
                );
                const imageSrc =
                  pageWithImage?.thumbnail?.source ||
                  pageWithImage?.originalimage?.source;

                return (
                  <Card
                    key={index}
                    className="hover:shadow-lg transition-shadow"
                  >
                    <CardBody>
                      <div className="flex gap-4">
                        {/* 左侧列：年份和图片 */}
                        <div className="flex flex-col gap-3 items-start">
                          <Chip color="danger" size="lg">
                            {event.year}
                          </Chip>
                          {imageSrc && (
                            <div className="flex-shrink-0 bg-default-100 rounded-lg overflow-hidden w-24 h-24 md:w-32 md:h-32 flex items-center justify-center">
                              <img
                                alt={event.pages?.[0]?.title || ""}
                                className="max-w-full max-h-full"
                                loading="eager"
                                src={imageSrc}
                                style={{ objectFit: "contain" }}
                              />
                            </div>
                          )}
                        </div>
                        {/* 右侧列：标题和描述 */}
                        <div className="flex flex-col gap-3 flex-1">
                          <p className="text-sm md:text-base font-semibold">
                            {event.text}
                          </p>
                          {event.pages && event.pages.length > 0 && (
                            <p className="text-xs md:text-sm text-default-600 line-clamp-3">
                              {event.pages[0].extract}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Historical Events */}
        {data?.events && data.events.length > 0 && (
          <div>
            <h2 className="text-xl md:text-2xl font-bold mb-4">历史事件</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.events.slice(0, 10).map((event, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardBody>
                    <div className="flex gap-3">
                      <Chip color="danger" variant="flat">
                        {event.year}
                      </Chip>
                      <p className="text-sm flex-1">{event.text}</p>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Births */}
        {data?.births && data.births.length > 0 && (
          <div>
            <h2 className="text-xl md:text-2xl font-bold mb-4">出生</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.births.slice(0, 8).map((event, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardBody>
                    <div className="flex gap-3">
                      <Chip color="success" variant="flat">
                        {event.year}
                      </Chip>
                      <p className="text-sm flex-1">{event.text}</p>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Deaths */}
        {data?.deaths && data.deaths.length > 0 && (
          <div>
            <h2 className="text-xl md:text-2xl font-bold mb-4">逝世</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.deaths.slice(0, 8).map((event, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardBody>
                    <div className="flex gap-3">
                      <Chip color="default" variant="flat">
                        {event.year}
                      </Chip>
                      <p className="text-sm flex-1">{event.text}</p>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

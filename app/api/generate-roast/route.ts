import { NextRequest, NextResponse } from "next/server";

// 系统提示词，定义吐槽风格
// 在集成真实模型API时会用到这个prompt
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const SYSTEM_PROMPT = `你是一个嘴替机器人，专门帮用户发泄情绪。用户会告诉你他们遇到的糟心事，你需要用犀利、幽默、带有"国粹"风格的语言帮他们吐槽出来。

要求：
1. 语言要接地气，可以用一些俚语、俗语
2. 可以适当使用一些委婉的骂人话，但不要太过分
3. 要有共情能力，先理解用户的情绪
4. 吐槽要有逻辑，要骂到点子上
5. 最后可以加一句安慰或鼓励的话
6. 控制在200字以内

风格参考：郭德纲相声、脱口秀大会`;

export async function POST(request: NextRequest) {
  try {
    const { complaint } = await request.json();

    if (!complaint) {
      return NextResponse.json({ error: "缺少吐槽内容" }, { status: 400 });
    }

    // TODO: 替换为你自己部署的模型API
    // 下面是一个示例实现，你需要根据你的模型API进行修改

    // 示例1: 如果使用OpenAI兼容的API
    /*
    const response = await fetch("YOUR_MODEL_API_URL/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.MODEL_API_KEY}`,
      },
      body: JSON.stringify({
        model: "your-model-name",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: complaint },
        ],
        temperature: 0.8,
        max_tokens: 500,
      }),
    });

    const data = await response.json();
    const roast = data.choices[0].message.content;
    */

    // 示例2: 临时的mock响应，用于测试UI
    const mockRoast = generateMockRoast(complaint);

    return NextResponse.json({ roast: mockRoast });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("生成吐槽失败:", error);

    return NextResponse.json({ error: "生成失败" }, { status: 500 });
  }
}

// 临时的mock函数，用于测试
function generateMockRoast(complaint: string): string {
  const roasts = [
    `哎呦我去，这事儿搁谁谁不气啊！${complaint.slice(0, 20)}...这种事情也能发生？这不纯纯欺负老实人吗！搁古代这叫"欺人太甚"，搁现在这叫"不拿豆包当干粮"！不过话说回来，别往心里去，这种人早晚得遭报应，咱不跟这帮孙子一般见识！`,
    `我滴个乖乖，还有这种事？！听完我这火蹭蹭往上冒！这不明摆着拿你当软柿子捏吗？这种人啊，典型的"吃柿子专挑软的捏"，脸皮比城墙拐角还厚！但是啊，老话说得好，"让他三尺又何妨"，犯不着跟这种人置气，气坏了身子不划算！`,
    `好家伙，这操作属实给我整不会了！这人脑子是让门挤了还是让驴踢了？这种事情都干得出来，搁过去这叫"寡廉鲜耻"！不过你也别太气，这种人早晚自己把自己作死，咱们坐等看戏就完了！`,
  ];

  return roasts[Math.floor(Math.random() * roasts.length)];
}

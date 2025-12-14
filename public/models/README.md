# Live2D 模型配置说明

本目录用于存放 Live2D 模型文件。

## 快速开始

### 1. 下载示例模型

推荐使用官方示例模型 **Hiyori**：

**下载地址**：
- GitHub: https://github.com/guansss/pixi-live2d-display/tree/master/test/assets/hiyori
- 或者从 Live2D 官方示例中获取

### 2. 模型文件结构

下载后，将模型文件放置在对应的目录中：

```
public/models/
└── hiyori/
    ├── hiyori.model.json          # 模型配置文件（必需）
    ├── hiyori.moc                 # 模型数据文件（必需）
    ├── hiyori.physics.json        # 物理效果配置（可选）
    ├── hiyori.pose.json           # 姿势配置（可选）
    ├── textures/                  # 纹理目录
    │   └── texture_00.png
    ├── motions/                   # 动作目录
    │   ├── idle_01.mtn
    │   ├── tap_body_01.mtn
    │   └── ...
    └── expressions/               # 表情目录
        ├── f01.json
        └── ...
```

### 3. 使用其他模型

如果你想使用其他 Live2D 模型：

1. 将模型文件夹放入 `public/models/` 目录
2. 在组件中修改模型路径：

```tsx
<Live2DCharacter modelUrl="/models/your-model/model.json" />
```

## 模型资源

### 官方资源

- **Live2D 官网**: https://www.live2d.com/
- **Cubism Editor**: https://www.live2d.com/download/cubism-sdk/
- **官方示例**: https://github.com/Live2D/CubismWebSamples

### 开源模型

- **pixi-live2d-display 示例**: https://github.com/guansss/pixi-live2d-display/tree/master/test/assets
- **Live2D 社区**: https://live2d.github.io/

### 自制模型

使用 **Live2D Cubism Editor** 创建自己的模型：
1. 下载 Cubism Editor（免费版可用）
2. 导入 PSD 文件
3. 设置网格和参数
4. 导出为 Web 格式

## 模型格式支持

本项目支持以下 Live2D 模型格式：

- ✅ Cubism 2.1 (`.moc` 文件)
- ✅ Cubism 3.0+ (`.moc3` 文件)
- ✅ Cubism 4.0+ (`.moc3` 文件)

## 常见问题

### Q: 模型加载失败怎么办？

1. 检查模型文件路径是否正确
2. 确保 `.model.json` 文件中的路径配置正确
3. 检查浏览器控制台的错误信息
4. 确认模型文件完整（包括纹理、动作等）

### Q: 如何调整模型大小和位置？

在 `Live2DCharacter` 组件中修改 `width` 和 `height` 属性：

```tsx
<Live2DCharacter
  modelUrl="/models/hiyori/hiyori.model.json"
  width={1000}
  height={800}
/>
```

### Q: 如何添加自定义交互？

编辑 `components/live2d-character.tsx`，在点击事件处理中添加自定义逻辑：

```typescript
model.on("hit", (hitAreas: string[]) => {
  if (hitAreas.includes("body")) {
    model.motion("tap_body");
  }
  // 添加更多交互逻辑
});
```

## 许可证

请注意：
- Live2D 模型可能受版权保护
- 使用第三方模型前请确认许可证
- 商业使用需要获得相应授权

## 参考链接

- [Live2D 官方文档](https://docs.live2d.com/)
- [pixi-live2d-display 文档](https://github.com/guansss/pixi-live2d-display)
- [Cubism SDK 文档](https://docs.live2d.com/cubism-sdk-tutorials/top/)

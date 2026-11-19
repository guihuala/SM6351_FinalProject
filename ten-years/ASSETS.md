# 视觉资产

## 水下开场

当前首页和独立图表页共用 [dist/ocean/assets](dist/ocean/assets/) 中的双髻鲨模型、深水背景和气泡。两页共用的 Three.js、GSAP 及相关加载器保存在 [dist/ocean/vendor](dist/ocean/vendor/)。

[dist/opening/assets](dist/opening/assets/) 存放首页专用的水面备用图、捕捞装置模型和开场字体。停留在开场时，动态水面会延后向 Spline 加载，备用图始终随网站提供。

- 场景参考 [The Race Below](https://storytelling.11thhourracing.org/the-race-below)，11th Hour Racing / HLabs。
- 模型 [Scalloped hammerhead juvenile low poly](https://sketchfab.com/3d-models/scalloped-hammerhead-juvenile-low-poly-f5adc17c922b48feae76aaea98552dd4)。
- 第三方素材和库遵循各自的原有授权。

## 产品形式配图

项目页面使用三张内置图像生成器制作的标本风格示意图，对应 CITES 申报类别。FIN 配图用通用鱼鳍指代未细分的类别。

- [未细分鱼鳍（FIN）](dist/images/unspecified-fins.webp)
- [干鳍（DFN）](dist/images/dried-fins.webp)
- [湿鳍（FFN）](dist/images/wet-fins.webp)

生成提示词

**FIN**

> Use case: scientific-educational. Generate a single specimen-style image for a dark marine trade data website. Subject: a neutral silver-gray shark dorsal fin specimen with a matte surface, shown as a generic fin symbol for an unspecified reporting category, clearly recognizable swept-back dorsal fin silhouette, no indication of a specific preparation method, no packaging. Museum specimen illustration with the tactile realism of a softly lit studio cutout. A straight side profile with broad base at bottom and tip sweeping toward the right. Compact silhouette that reads immediately as a single shark fin at 44 pixels. Center the entire fin, occupy most of the frame, keep a small even clear margin. Readable cool or warm edge highlights against very dark navy. Clinical non-graphic treatment, no blood or exposed flesh, no person, fish body, props, shadow, baseline, text, symbols or labels. Truly transparent background with alpha.

**DFN**

> Generate an isolated museum specimen cutout for a 40-pixel web thumbnail. A single dried shark fin in side profile, a triangular dorsal fin with a subtle organic curl and flat base, small sparse fibrous ridges. It is opaque, desaturated light tan parchment brown with soft white frontal lighting, a matte finish and legible contour. The scene has no background or environment. Every pixel outside the physical fin is truly transparent alpha. Keep the shape entirely in frame. No shadow, no glow, no rim lighting, no colored lighting, no gradients outside the object, no text, no graphic elements, no frame.

**FFN**

> Use case: scientific-educational. Generate a single specimen-style image for a dark marine trade data website. Subject: one moist shark dorsal fin specimen, an intact crisp swept-back triangular shape in cool dark slate-blue with a bright cool silver-blue edge and subtle broad wet sheen, smooth flexible-looking surface with faint highlights, no surrounding water. Museum specimen illustration with the tactile realism of a softly lit studio cutout. A straight side profile with broad base at bottom and tip sweeping toward the right. Compact silhouette that reads immediately as a single shark fin at 44 pixels. Center the entire fin, occupy most of the frame, keep a small even clear margin. Readable cool or warm edge highlights against very dark navy. Clinical non-graphic treatment, no blood or exposed flesh, no person, fish body, props, shadow, baseline, text, symbols or labels. Truly transparent background with alpha.

## 历史视觉资产（当前单页不使用）

旧版双髻鲨章节插画由 ImageGen 于 2026-11-04 生成。

最终提示词：

Use case: photorealistic-natural. Asset type: cinematic website chapter hero background, wide landscape 16:9. An evocative, scientifically plausible scalloped hammerhead shark (Sphyrna lewini), one shark only, photographed underwater at night in vast near-black deep navy open water. Full animal visible in oblique overhead view, broad recognizable scalloped hammer head at upper right, tapered muscular grey body extending diagonally toward bottom left, elegant wide pectoral fins, natural asymmetric caudal fin. The shark occupies the right 60 percent of frame, with substantial empty inky water on the left for large editorial typography. Subtle cool silver side illumination reveals skin texture and silhouette, dramatic restrained high contrast, delicate sparse suspended particulate, marine documentary feeling, premium museum exhibition atmosphere. Color palette almost black #071719, silver grey, muted petrol teal. No seabed, no reef, no divers, no other animals, no bubbles, no glowing eyes, no typography, no labels, no logos, no borders. Image is illustrative artwork, not a photograph claimed as biological evidence.

图表使用 [dist/fonts](dist/fonts/) 提供的本地字体。

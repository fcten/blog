---
title: 6000 美元本地运行 671B 完整版 Deepseek-R1
date: 2025-01-31 12:25:56
tags:
- AI
- LLM
- DeepSeek
categories:
- 数智科技编年史
---

> 本方案由 DeepSeek R1 翻译并总结自 [Matthew Carrigan](https://x.com/carrigmat/status/1884244369907278106)

本地运行 Deepseek-R1 的完整硬件 + 软件设置。运行完整的 671B 模型（Q8量化）而非蒸馏模型。总成本约 6000 美元。

本配置不需要昂贵的 GPU。如果你想要拥有一个 > 700GB 显存的硬件配置，可能会花费 10 万美元以上

<!--more-->

### 硬件配置

| 部件         | 推荐型号/信息                                                                                       | 关键规格和其他注意事项                                                                                     |
|--------------|----------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------|
| 主板          | 技嘉 MZ73-LM0 或 MZ73-LM1                                                                        | 需要 2 个 EPYC 插座，以支持 24 通道 DDR5 内存，最大化内存容量和带宽。                                          |
| CPU           | 2 颗 AMD EPYC 9004 或 9005 系列处理器                                                            | LLM 生成受限于内存带宽，因此不需要顶级型号。                                                                |
| 内存          | 768GB DDR5-RDIMM 模块（分布在 24 个内存通道上）                                                   | 每个通道使用 32GB DDR5-RDIMM 模块，总计 24 x 32GB = 768GB。                                                     |
| 机箱          | 建议使用适合服务器主板的标准塔式机箱（如 Enthoo Pro 2 Server）                                   | 确保机箱有适合全尺寸服务器主板的螺丝固定点，大多数消费级机箱不支持。                                         |
| 电源          | Corsair HX1000i 或其他足够提供多 CPU 供电的电源                                                  | 功耗较低（<400W），但需确保有足够的 CPU 供电线缆以支持双 EPYC 处理器。                                      |
| 散热器与风扇   | 如果原装散热器风扇噪音较大，可考虑更换为高效且静音的风扇                                         | 每个散热器可搭配 1 或 2 个高效风扇以降低噪音并提升散热效率。                                                 |
| 固态硬盘（SSD）| 1TB 或更大的 NVMe SSD                                                                            | 建议使用 NVMe，因为启动模型时需要将约 700GB 的权重文件从 SSD 复制到 RAM。                                      |

### 注意事项
1. 安装完成后，请确保将系统设置为 Linux 操作系统。
2. 在 BIOS 中禁用 NUMA（设置为 0），以优化模型在所有内存通道之间的交错分布，从而提升性能。

### 安装软件
1. 安装 [llama.cpp](https://github.com/ggerganov/llama.cpp)
2. 访问 [Hugging Face](https://huggingface.co/unsloth/DeepSeek-R1-GGUF) 平台，获取 Q8_0 文件夹中的所有文件（约 700GB）。

### 快速开始

```bash
llama-cli -m ./DeepSeek-R1.Q8_0-00001-of-00015.gguf --temp 0.6 -no-cnv -c 16384 -p "<｜用户｜>草莓中有多少个 R？<｜助手｜>"
```

### 推理速度

这个配置的推理速度为每秒 6 到 8 个 token，具体取决于您获得的 CPU 和 RAM 速度，或者如果您有较长的上下文，可能会稍微慢一些。
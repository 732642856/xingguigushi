#!/usr/bin/env python3
"""
Qwen3.5-4B-MLX 性能测试脚本
测试推理速度和内存占用
"""

import time
import mlx.core as mx
from mlx_lm import load, generate

def benchmark_model(model_name="mlx-community/Qwen3.5-4B-MLX", max_tokens=200):
    """测试模型推理性能"""
    
    print(f"正在加载模型: {model_name}")
    print("-" * 50)
    
    # 记录加载时间
    load_start = time.time()
    model, tokenizer = load(model_name)
    load_time = time.time() - load_start
    
    print(f"✓ 模型加载完成，耗时: {load_time:.2f}秒")
    print("-" * 50)
    
    # 测试用的提示词
    prompts = [
        "你好，请介绍一下自己。",
        "请用中文解释一下什么是机器学习。",
        "写一段Python代码来计算斐波那契数列。"
    ]
    
    results = []
    
    for i, prompt in enumerate(prompts, 1):
        print(f"\n测试 {i}/{len(prompts)}: {prompt[:30]}...")
        
        # 准备输入
        messages = [{"role": "user", "content": prompt}]
        text = tokenizer.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=True
        )
        
        # 预热（第一次推理通常较慢）
        if i == 1:
            print("  正在预热...")
            generate(model, tokenizer, prompt=text, max_tokens=10, verbose=False)
        
        # 正式测试
        start_time = time.time()
        start_tokens = time.time()
        
        response = generate(
            model, 
            tokenizer, 
            prompt=text, 
            max_tokens=max_tokens,
            verbose=False
        )
        
        end_time = time.time()
        
        # 计算指标
        total_time = end_time - start_time
        tokens_generated = len(tokenizer.encode(response))
        tokens_per_sec = tokens_generated / total_time
        
        print(f"  生成token数: {tokens_generated}")
        print(f"  总耗时: {total_time:.2f}秒")
        print(f"  推理速度: {tokens_per_sec:.2f} tokens/秒")
        
        results.append({
            "prompt": prompt[:30],
            "tokens": tokens_generated,
            "time": total_time,
            "speed": tokens_per_sec
        })
    
    # 汇总结果
    print("\n" + "=" * 50)
    print("测试结果汇总")
    print("=" * 50)
    avg_speed = sum(r["speed"] for r in results) / len(results)
    print(f"平均推理速度: {avg_speed:.2f} tokens/秒")
    print(f"模型加载时间: {load_time:.2f}秒")
    
    # 性能评级
    if avg_speed > 50:
        rating = "🚀 极快 (适合实时应用)"
    elif avg_speed > 20:
        rating = "⚡ 很快 (体验流畅)"
    elif avg_speed > 10:
        rating = "✓ 良好 (日常使用没问题)"
    elif avg_speed > 5:
        rating = "○ 一般 (略有延迟)"
    else:
        rating = "○ 较慢 (需要耐心等待)"
    
    print(f"性能评级: {rating}")
    print("=" * 50)

if __name__ == "__main__":
    try:
        benchmark_model()
    except Exception as e:
        print(f"\n❌ 测试出错: {e}")
        print("\n请确保已安装必要的依赖:")
        print("  pip install mlx mlx-lm")

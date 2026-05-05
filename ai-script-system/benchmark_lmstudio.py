#!/usr/bin/env python3
"""
LM Studio 本地 API 速度测试脚本 (使用内置 urllib，无需安装 requests)
测试与本地 LM Studio 的通信延迟和推理速度
"""

import time
import json
import urllib.request
import urllib.error

def make_request(url, data=None, headers=None, timeout=10):
    """使用 urllib 发送请求"""
    req = urllib.request.Request(url, data=data, headers=headers or {}, method='POST' if data else 'GET')
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            return response.status, response.read().decode('utf-8')
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode('utf-8')
    except Exception as e:
        return 0, str(e)

def test_lmstudio_speed(base_url="http://127.0.0.1:1234", model="qwen/qwen3.5-9b"):
    """测试 LM Studio API 性能"""
    
    print("=" * 60)
    print("LM Studio 本地 API 速度测试")
    print("=" * 60)
    
    # 测试连接
    print(f"\n1. 测试连接: {base_url}")
    try:
        status, body = make_request(f"{base_url}/v1/models", timeout=5)
        if status == 200:
            result = json.loads(body)
            models = result.get("data", [])
            print(f"   ✓ 连接成功")
            print(f"   可用模型数: {len(models)}")
            if models:
                for m in models[:3]:
                    print(f"   - {m.get('id', 'unknown')}")
        else:
            print(f"   ✗ 连接失败: HTTP {status}")
            return
    except Exception as e:
        print(f"   ✗ 无法连接到 LM Studio: {e}")
        print("\n   请确保:")
        print("   1. LM Studio 已启动")
        print("   2. 本地服务器已开启 (设置 → 本地服务器 → 启动)")
        print("   3. 端口 1234 未被占用")
        return
    
    # 测试网络延迟
    print(f"\n2. 测试网络延迟")
    ping_times = []
    for i in range(5):
        start = time.time()
        try:
            make_request(f"{base_url}/v1/models", timeout=2)
            ping_times.append((time.time() - start) * 1000)
        except:
            pass
        time.sleep(0.1)
    
    avg_ping = sum(ping_times) / len(ping_times) if ping_times else 0
    if ping_times:
        print(f"   平均延迟: {avg_ping:.2f}ms")
        if avg_ping < 10:
            print(f"   评级: 🚀 极快 (本地直连)")
        elif avg_ping < 50:
            print(f"   评级: ⚡ 很快")
        else:
            print(f"   评级: ○ 较慢")
    
    # 测试推理速度
    print(f"\n3. 测试推理速度")
    
    test_prompts = [
        "你好",
        "请用一句话介绍机器学习",
        "写一段Python代码",
    ]
    
    headers = {"Content-Type": "application/json"}
    
    for i, prompt in enumerate(test_prompts, 1):
        print(f"\n   测试 {i}/3: '{prompt[:20]}...'")
        
        payload = {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 100,
            "temperature": 0.7,
            "stream": False
        }
        
        start_time = time.time()
        
        try:
            data = json.dumps(payload).encode('utf-8')
            status, body = make_request(
                f"{base_url}/v1/chat/completions",
                data=data,
                headers=headers,
                timeout=60
            )
            
            end_time = time.time()
            total_time = end_time - start_time
            
            if status == 200:
                result = json.loads(body)
                message = result["choices"][0]["message"]
                content = message.get("content", "")
                reasoning = message.get("reasoning_content", "")
                
                # 优先使用 content，如果没有则使用 reasoning_content
                actual_content = content if content else reasoning
                
                # 从 usage 获取准确的 token 数
                usage = result.get("usage", {})
                actual_tokens = usage.get("completion_tokens", 0)
                
                if not actual_content and actual_tokens == 0:
                    print(f"   ⚠️ 返回内容为空")
                    print(f"   完整响应: {body[:500]}")
                    continue
                
                # 使用实际 token 数计算速度
                tokens_per_sec = actual_tokens / total_time if total_time > 0 else 0
                
                print(f"   生成内容长度: {len(actual_content)} 字符")
                print(f"   实际生成token数: {actual_tokens}")
                if reasoning and not content:
                    print(f"   注意: 模型使用了 reasoning 模式")
                print(f"   内容预览: {actual_content[:50]}...")
                print(f"   总耗时: {total_time:.2f}秒")
                print(f"   推理速度: {tokens_per_sec:.2f} tokens/秒")
                
                # 性能评级
                if tokens_per_sec > 50:
                    rating = "🚀 极快"
                elif tokens_per_sec > 20:
                    rating = "⚡ 很快"
                elif tokens_per_sec > 10:
                    rating = "✓ 良好"
                else:
                    rating = "○ 较慢"
                print(f"   性能评级: {rating}")
            else:
                print(f"   ✗ 请求失败: HTTP {status}")
                print(f"   错误: {body[:200]}")
                
        except Exception as e:
            print(f"   ✗ 请求出错: {e}")
    
    print("\n" + "=" * 60)
    print("测试完成")
    print("=" * 60)
    print("\n如果速度很慢，可能原因:")
    print("  1. 模型太大，超出您的硬件能力")
    print("  2. LM Studio 使用了 CPU 而非 GPU 推理")
    print("  3. 内存不足导致频繁换页")
    print("  4. 其他程序占用资源")
    print("\n建议:")
    print("  - 在 LM Studio 中检查是否启用了 GPU 加速")
    print("  - 尝试使用更小的模型 (如 4-bit 量化版)")
    print("  - 关闭其他占用资源的程序")

if __name__ == "__main__":
    import sys
    
    url = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:1234"
    model_name = sys.argv[2] if len(sys.argv) > 2 else "qwen/qwen3.5-9b"
    
    test_lmstudio_speed(url, model_name)

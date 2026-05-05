#!/usr/bin/env python3
"""
诊断 WorkBuddy 连接 LM Studio 速度慢的问题
模拟 WorkBuddy 的连接方式进行测试
"""

import time
import json
import urllib.request
import urllib.error

def make_request(url, data=None, headers=None, timeout=30):
    """发送 HTTP 请求"""
    req = urllib.request.Request(
        url, 
        data=data, 
        headers=headers or {}, 
        method='POST' if data else 'GET'
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            return response.status, response.read().decode('utf-8')
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode('utf-8')
    except Exception as e:
        return 0, str(e)

def test_streaming_response(base_url="http://127.0.0.1:1234", model="qwen/qwen3.5-9b"):
    """
    测试流式响应 - WorkBuddy 通常使用流式模式
    """
    print("=" * 60)
    print("测试流式响应 (Streaming)")
    print("=" * 60)
    print("注意: WorkBuddy 通常使用流式模式，这可能导致感知上的延迟")
    print()
    
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": "你好"}],
        "max_tokens": 100,
        "stream": True,  # 启用流式
        "temperature": 0.7
    }
    
    headers = {
        "Content-Type": "application/json",
        "Accept": "text/event-stream"
    }
    
    print("发送流式请求...")
    start_time = time.time()
    first_chunk_time = None
    chunk_count = 0
    total_chars = 0
    
    try:
        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(
            f"{base_url}/v1/chat/completions",
            data=data,
            headers=headers,
            method='POST'
        )
        
        with urllib.request.urlopen(req, timeout=60) as response:
            # 读取流式响应
            for line in response:
                chunk_count += 1
                if first_chunk_time is None:
                    first_chunk_time = time.time()
                
                line_str = line.decode('utf-8').strip()
                if line_str.startswith('data: '):
                    json_str = line_str[6:]  # 去掉 "data: " 前缀
                    if json_str == '[DONE]':
                        break
                    try:
                        chunk = json.loads(json_str)
                        delta = chunk.get('choices', [{}])[0].get('delta', {})
                        content = delta.get('content', '')
                        total_chars += len(content)
                    except:
                        pass
        
        end_time = time.time()
        
        # 计算指标
        time_to_first_chunk = (first_chunk_time - start_time) * 1000 if first_chunk_time else 0
        total_time = (end_time - start_time) * 1000
        
        print(f"首字节延迟 (TTFB): {time_to_first_chunk:.2f}ms")
        print(f"总耗时: {total_time:.2f}ms")
        print(f"接收数据块数: {chunk_count}")
        print(f"总字符数: {total_chars}")
        
        if time_to_first_chunk < 100:
            print("首字节评级: 🚀 极快")
        elif time_to_first_chunk < 500:
            print("首字节评级: ⚡ 很快")
        elif time_to_first_chunk < 2000:
            print("首字节评级: ✓ 良好")
        else:
            print("首字节评级: ○ 较慢")
            
    except Exception as e:
        print(f"流式测试出错: {e}")

def test_different_settings(base_url="http://127.0.0.1:1234", model="qwen/qwen3.5-9b"):
    """
    测试不同参数设置的影响
    """
    print("\n" + "=" * 60)
    print("测试不同参数设置")
    print("=" * 60)
    
    configs = [
        {"name": "默认设置", "stream": False, "temperature": 0.7},
        {"name": "流式模式", "stream": True, "temperature": 0.7},
        {"name": "低温采样", "stream": False, "temperature": 0.1},
        {"name": "高温采样", "stream": False, "temperature": 1.0},
    ]
    
    for config in configs:
        print(f"\n测试: {config['name']}")
        print(f"  stream={config['stream']}, temperature={config['temperature']}")
        
        payload = {
            "model": model,
            "messages": [{"role": "user", "content": "你好"}],
            "max_tokens": 50,
            "stream": config['stream'],
            "temperature": config['temperature']
        }
        
        start = time.time()
        try:
            data = json.dumps(payload).encode('utf-8')
            status, body = make_request(
                f"{base_url}/v1/chat/completions",
                data=data,
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            elapsed = (time.time() - start) * 1000
            
            if status == 200:
                print(f"  ✓ 成功, 耗时: {elapsed:.2f}ms")
            else:
                print(f"  ✗ 失败: HTTP {status}, 耗时: {elapsed:.2f}ms")
        except Exception as e:
            print(f"  ✗ 错误: {e}")

def check_server_config(base_url="http://127.0.0.1:1234"):
    """
    检查服务器配置
    """
    print("\n" + "=" * 60)
    print("检查 LM Studio 服务器配置")
    print("=" * 60)
    
    # 检查模型列表
    print("\n1. 已加载的模型:")
    try:
        status, body = make_request(f"{base_url}/v1/models", timeout=5)
        if status == 200:
            models = json.loads(body).get("data", [])
            for m in models:
                model_id = m.get('id', 'unknown')
                print(f"   - {model_id}")
        else:
            print(f"   无法获取模型列表: HTTP {status}")
    except Exception as e:
        print(f"   错误: {e}")
    
    print("\n2. 可能的问题:")
    print("   - WorkBuddy 可能使用了不同的超时设置")
    print("   - WorkBuddy 可能强制使用流式响应")
    print("   - 防火墙或代理可能影响了连接")
    print("   - WorkBuddy 的 HTTP 客户端配置不同")

def provide_recommendations():
    """
    提供优化建议
    """
    print("\n" + "=" * 60)
    print("优化建议")
    print("=" * 60)
    print("""
如果在 WorkBuddy 中感觉很慢，尝试以下方法:

1. 在 WorkBuddy 设置中:
   - 检查是否启用了流式响应 (streaming)
   - 尝试关闭流式响应，使用普通模式
   - 增加超时时间设置

2. 在 LM Studio 中:
   - 确保 GPU Layers 设置为最大
   - 检查 Context Length 不要设置过大
   - 尝试使用更小的模型 (如 4B 替代 9B)

3. 网络方面:
   - 确保没有代理干扰
   - 检查防火墙设置
   - 尝试使用 127.0.0.1 替代 localhost

4. 系统方面:
   - 关闭其他占用内存的程序
   - 确保 Mac 连接电源（性能模式）
   - 检查活动监视器中的资源占用
""")

if __name__ == "__main__":
    import sys
    
    url = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:1234"
    model = sys.argv[2] if len(sys.argv) > 2 else "qwen/qwen3.5-9b"
    
    print("WorkBuddy 连接诊断工具")
    print(f"LM Studio URL: {url}")
    print(f"模型: {model}")
    print()
    
    test_streaming_response(url, model)
    test_different_settings(url, model)
    check_server_config(url)
    provide_recommendations()

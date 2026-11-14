import os
import requests

# 通过环境变量传入测试账号与接口地址，避免在仓库中硬编码凭据
BASE = os.environ.get("API_BASE", "http://localhost:80/api")
EMAIL = os.environ.get("TEST_EMAIL", "")
PASSWORD = os.environ.get("TEST_PASSWORD", "")

if not EMAIL or not PASSWORD:
    raise SystemExit("请先设置环境变量 TEST_EMAIL 与 TEST_PASSWORD 后再运行本脚本")

# 1. 登录拿 token
r = requests.post(f"{BASE}/auth/login", json={
    "email": EMAIL,
    "password": PASSWORD,
})
print("login status:", r.status_code)
token = r.cookies.get("access_token")
print("token:", (token[:30] + "...") if token else None)

if token:
    # 2. 通过 nginx 调用数智赋能对话接口
    print("\n--- calling /api/lingmiao/chat via nginx ---")
    r3 = requests.post(
        f"{BASE}/lingmiao/chat",
        json={"message": "你好", "dh_type": "glb"},
        cookies={"access_token": token},
        stream=True,
        timeout=60
    )
    print("chat status:", r3.status_code)
    if r3.status_code == 200:
        for line in r3.iter_lines(decode_unicode=True):
            if line:
                print("SSE:", line[:150])
    else:
        print("body:", r3.text[:500])

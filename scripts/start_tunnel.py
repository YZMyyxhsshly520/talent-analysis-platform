"""Start ngrok tunnel to expose the local HTTP server publicly."""
import os
import time
from pyngrok import ngrok
from pyngrok.conf import PyngrokConfig

# Use a writable directory for ngrok binary and config
workspace = os.path.dirname(os.path.abspath(__file__))
ngrok_dir = os.path.join(workspace, ".ngrok")
os.makedirs(ngrok_dir, exist_ok=True)
ngrok_path = os.path.join(ngrok_dir, "ngrok.exe")
config_path = os.path.join(ngrok_dir, "ngrok.yml")

pyngrok_config = PyngrokConfig(
    ngrok_path=ngrok_path,
    config_path=config_path,
)

public_url = ngrok.connect(8765, "http", pyngrok_config=pyngrok_config)
print("PUBLIC_URL:" + public_url)
print("Tunnel is open. Press Ctrl+C to stop.")

try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    ngrok.kill()
    print("Tunnel closed.")

# 目的：获取gooboo所有icon（未完成）

import requests
from bs4 import BeautifulSoup
import os
import urllib.parse

# 1. 定义起始URL和目标文件夹
start_url = "https://gityxs.github.io/gooboo/"
download_folder = "game_icons"
if not os.path.exists(download_folder):
    os.makedirs(download_folder)

# 2. 获取网页内容
response = requests.get(start_url)
soup = BeautifulSoup(response.text, 'html.parser')

# 3. 查找所有的 <img> 标签
for img_tag in soup.find_all('img'):
    img_url = img_tag.get('src')
    if img_url:
        # 4. 拼接完整的URL (处理相对路径)
        full_url = urllib.parse.urljoin(start_url, img_url)

        # 5. 下载图片
        try:
            img_data = requests.get(full_url).content
            # 从URL中提取文件名
            file_name = os.path.join(download_folder, os.path.basename(urllib.parse.urlparse(full_url).path))
            with open(file_name, 'wb') as handler:
                handler.write(img_data)
            print(f"Downloaded: {file_name}")
        except Exception as e:
            print(f"Could not download {full_url}. Error: {e}")
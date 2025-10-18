

- 镜像名：
  - GHCR: `ghcr.io/cocolight/liteportal`
  - Docker Hub: `alili7/liteportal`

- 数据卷挂到宿主 `./data`，数据库持久化
- 端口默认 `8080`，可改
- 环境变量全部外部化，升级时直接改文件即可

```yaml
# docker-compose.yml
version: "3.9"

services:
  liteportal:
    image: ghcr.io/cocolight/liteportal:latest
    container_name: liteportal
    restart: unless-stopped
    ports:
      - "8080:8080"           # 宿主机:容器
    volumes:
      - ./data:/app/data      # 数据库持久化
    environment:
      PORT: 8080
      MAX_BODY_SIZE: 10mb
      LOG_LEVEL: info
      INIT_DATA: "true"
```

### 🚀 使用

1. 把文件存成 `docker-compose.yml`

3. **拉取镜像**  
   
   ```bash
   docker compose pull   
   docker compose up -d
   ```



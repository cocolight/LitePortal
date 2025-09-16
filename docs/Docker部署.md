## 运行容器



```bash
docker run -d \
  -p 8080:8080 \
  -v $(pwd)/backend/database.sqlite:/app/backend/database.sqlite:rw \
  --name my-app \
  my-app
```


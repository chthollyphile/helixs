# HelixS

A futuristic, wireframe-style 3D navigation interface for homelab services featuring a DNA-helix interaction model and dynamic LAN/WAN routing.

![HelixS Preview](https://placehold.co/800x400/050505/00f3ff?text=HelixS+Preview)

## 部署方式

- **Vercel 一键部署**  
  点击下方按钮，选择自己的仓库即可。首次部署后，在 Vercel 控制台设置 `lang`（可选）等环境变量。  
  [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fchthollyphile%2Fhelixs)

- **本地/服务器 Node 部署**  
  1. 克隆仓库并进入目录  
     ```bash
     git clone <your-repo> helixs && cd helixs
     ```
  2. 安装依赖：`npm install`  
  3. 开发调试：`npm run dev`（默认 <http://localhost:5173>）  
  4. 生产构建：`npm run build`  
  5. 启动服务端渲染入口：`npm start`（默认监听 3234 端口，可用 `PORT` 环境变量覆盖）

- **Docker 部署**  
  ```bash
  docker build -t helixs:latest .
  docker run -d --name helixs \
    -e PORT=3234 \
    -e lang=en \
    -p 3234:3234 \
    -v $(pwd)/public/config.json:/app/public/config.json:ro \
    helixs:latest
  ```
  `scripts/push_docker.sh` 可将镜像推送到自己的仓库，记得先在脚本里替换镜像名。

- **Docker Compose**  
  ```bash
  docker compose up -d
  ```
  根据需要修改 `docker-compose.yml` 中的端口、环境变量与挂载路径。

## 配置

- 所有服务展示项来自 `public/config.json`。  
  - `lanUrl` 与 `wanUrl` 决定在局域网或外网访问时跳转的地址。  
  - `status`、`stats` 字段用于面板上的状态提示。  
  - 修改后无需重启容器，只要文件仍以只读方式挂载即可随时更新。
- 环境变量
  - `PORT`：服务监听端口（默认 3234）。  
  - `lang`：预设语种，默认为 `en`，若挂载自定义 i18n 配置可改为 `zh` 等。

## 使用说明

1. 访问部署地址即可看到 3D 导航面板。  
2. 鼠标或触控板滚动可浏览所有服务节点，点击后跳转到对应的 LAN/WAN 地址。  
3. 键盘输入会自动开启搜索，快速筛选服务名称。  
4. 若需要展示家庭实验室实时信息，只需更新 `public/config.json` 的 `stats` 与 `status` 字段，无须重新打包。

## 常见问题

- **如何同步配置到线上实例？**  
  - Node 或 Docker 本地部署：直接编辑 `public/config.json` 并重启/热加载。  
  - Vercel：建议将配置文件存入仓库并重新触发构建，或使用 Vercel KV/Edge Config 等外部数据源。

- **如何清理与升级？**  
  - Node 部署：`git pull && npm install && npm run build && npm start`。  
  - Docker 部署：重新构建镜像，使用 `docker compose up -d --build` 或 `docker run --pull always`。

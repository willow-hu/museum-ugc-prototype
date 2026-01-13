下面给你一个“从零到上线”的完整流程，包含命令和配置示例，但不改你仓库里的源代码文件。

有一个关键点先说清楚：  
你现在的前端里 API_BASE_URL = `http://localhost:3001/api`，这意味着：

- 本机开发时没问题（前端和后端在同一台电脑）。  
- 如果用户在自己手机 / 电脑上打开网页，`localhost` 指的是他们自己的机器，不是你的服务器——请求会失败。  

所以：

- **方案 A：不碰任何代码，只在服务器本机浏览器测试**（Remote Desktop，适合你自己或极少数被你远程控制的测试者）。  
- **方案 B：仍然不改 TypeScript 源码，只在“打包生成的 JS 文件里”把 `http://localhost:3001/api` 替换为“你的服务器公网地址”，这样其它设备访问才正常。**  

下面流程会把 A 和 B 都说明，你可以选 B 来满足“其他设备点击使用”。

---

## 0. 本地先确认项目能正常打包

在你自己的 Windows 开发机上（当前这个仓库目录）：

```bash
# 1. 安装根目录依赖（前端）
cd e:\Study\Game_as_UGC\Codes\museum-ugc-prototype
npm install

# 2. 编译前端，生成 dist
npm run build

# 3. 安装后端依赖并编译
cd backend
npm install
npm run build
```

确认本地跑是好的（用 `npm run dev` 等）再上云，会省很多排查时间。

---

## 1. 在阿里云购买一台轻量应用服务器

1. 登录阿里云控制台，搜索「轻量应用服务器」。  
2. 地域：选「中国香港」机房（不需要ICP备案，一周测试最省事）。  
3. 配置：1 核 1G、1–3M 带宽的最低配即可，购买 1 个月。  
4. 操作系统：选 Ubuntu 22.04 之类的 64 位 Linux。  
5. 记住：服务器的公网 IP 地址，以及 root 密码 / SSH 密钥。

---

## 2. 用 SSH 登录服务器

在你本地 Windows 上，用 PowerShell / cmd 或者 PuTTY 等工具：

```bash
ssh root@你的服务器公网IP
# 第一次会提示是否信任，输入 yes，然后输入密码
```

---

## 3. 在服务器上安装 Node.js 和 pm2

以 Ubuntu 为例（如果控制台里提供了一键 Node 环境，可跳过自行安装）：

```bash
# 更新软件索引
apt update

# 安装 curl（如果没有）
apt install -y curl

# 安装 Node.js（示例使用 20 版本）
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 验证
node -v
npm -v

# 安装 pm2 用于守护进程
npm install -g pm2
```

---

## 4. 把项目代码放到服务器上

有两种常见方式，任选其一：

### 方式 1：用 git 拉取（如果你代码在 GitHub/Gitee 等）

```bash
cd /root
git clone 仓库地址 museum-ugc-prototype
cd museum-ugc-prototype
```

### 方式 2：本地打压缩包上传

1. 在本地把整个项目目录压缩成 zip。  
2. 用阿里云控制台的「远程连接」里的文件上传功能，把 zip 传到 `/root`。  
3. 服务器上解压：

```bash
cd /root
unzip museum-ugc-prototype.zip -d museum-ugc-prototype
cd museum-ugc-prototype
```

假设最终项目路径为：`/root/museum-ugc-prototype`。

---

## 5. 在服务器部署后端（Express）

进入后端目录，安装依赖并启动服务：

```bash
cd /root/museum-ugc-prototype/backend

# 安装依赖
npm install

# 编译 TypeScript
npm run build

# 用 pm2 启动后端服务（假设 server.ts 监听 3001 端口）
pm2 start "node dist/server.js" --name museum-backend

# 查看运行状态
pm2 status
```

如果需要重启后端：

```bash
pm2 restart museum-backend
```

---

## 6. 在服务器打包前端

```bash
cd /root/museum-ugc-prototype

# 安装前端依赖
npm install

# 打包
npm run build
```

此时生成的打包目录约为：`/root/museum-ugc-prototype/dist`。

---

## 7.（可选但推荐）为多设备访问替换打包后的 API 地址

这一步**不改 TypeScript 源码**，只是在生成的 JS 文件里把 `http://localhost:3001/api` 替换成「你的服务器公网地址」，否则外部设备访问时请求会打到它们自己的 localhost。

假设：

- 你的服务器公网 IP 是 `47.242.123.118`  
- 你打算走 nginx 反向代理后端，并统一用 80 端口访问（推荐），那我们希望前端请求 `http://47.242.123.118/api`。

替换命令示例（在 `museum-ugc-prototype` 根目录下执行）：

```bash
cd /root/museum-ugc-prototype

# 全局替换 dist 目录里所有 js 文件中的 API 地址
grep -rl "http://localhost:3001/api" dist | xargs sed -i "s|http://localhost:3001/api|http://47.242.123.118/api|g"
```

注意把 `1.2.3.4` 换成你自己的实际公网 IP 或域名。

> 说明：  
> - 这样做不动源码，只修改打包产物。  
> - 如果你选择 **只在服务器本机浏览器测试**（方案 A），可以跳过这一步，保持 localhost 即可。

---

## 8. 安装 nginx 并部署前端 + 反向代理后端

### 8.1 安装 nginx

```bash
apt install -y nginx
```

启动并设置开机自启（一般安装时会自动启动）：

```bash
systemctl enable nginx
systemctl restart nginx
```

### 8.2 把前端 dist 拷贝到 nginx 目录

```bash
# 创建目录
mkdir -p /var/www/museum

# 拷贝打包结果
cp -r /root/museum-ugc-prototype/dist/* /var/www/museum/
```

### 8.3 配置 nginx 站点

编辑默认站点配置（示例路径）：

- 配置文件路径：/etc/nginx/sites-available/default

使用编辑器（如 nano 或 vim）：

```bash
nano /etc/nginx/sites-available/default
```

将 `server { ... }` 部分改成类似这样（示例）：

```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    server_name _;

    root /var/www/museum;
    index index.html;

    # 前端路由（如果你用的是前端单页应用路由）
    location / {
        try_files $uri /index.html;
    }

    # 反向代理接口到 Node 后端
    location /api/ {
        proxy_pass http://127.0.0.1:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

保存并退出后，检查配置是否正确并重载 nginx：

```bash
nginx -t
systemctl reload nginx
```

---

## 9. 打开安全组端口，测试访问

### 9.1 阿里云安全组开放 80 端口

在阿里云控制台：

1. 找到这台轻量应用服务器 → 网络与安全 → 安全组。  
2. 编辑规则，添加入方向规则：  
   - 协议：TCP  
   - 端口范围：80/80  
   - 授权对象：0.0.0.0/0（或你需要的 IP 范围）  

SSH 的 22 端口一般默认已开。

### 9.2 测试

- 在你本地电脑浏览器：访问 `http://你的公网IP`  
  - 如果看到你的 React 页面，说明 nginx 前端 OK。  
- 进行一次实际操作（比如发 UGC），然后检查后端服务器的 JSON 文件是否更新（在 backend 的 data 目录里）。  

---

## 10. 一周结束后导出数据

后端写入的数据应该在服务器的某个 JSON 文件中（例如 backend/data 目录下的 participants.json 等——以你后端实际路径为准）。

导出数据的方式示例：

```bash
# 从服务器下载到本地
scp root@你的公网IP:/root/museum-ugc-prototype/backend/data/*.json .
```

也可以在阿里云控制台的「远程连接」中用图形界面工具下载。

---

## 小结：最省事的推荐组合

- 一周测试，越省事越好：  
  - 一台「中国香港」轻量应用服务器（最低配）。  
  - 服务器上：Node + pm2 跑 backend，nginx 跑前端并反向代理 /api。  
  - 为了让「其他设备」访问正常，**建议执行第 7 步在打包后的 dist 里替换 API 地址**，不动源码。  

如果你愿意，我可以根据你后端 JSON 文件的具体路径，再帮你补一条“快速检查数据是否写入成功/如何查看实时日志（pm2 logs）”的小操作清单。
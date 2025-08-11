export type Platform = 'windows' | 'mac' | 'linux'

export interface PlatformConfig {
  name: string
  daemonPath: string
  configPath: string
  restartCommand: string
  instructions: string[]
}

export const platformConfigs: Record<Platform, PlatformConfig> = {
  windows: {
    name: 'Windows',
    daemonPath: 'C:\\Program Files\\Docker\\Docker\\resources\\dockerd.exe',
    configPath: '%USERPROFILE%\\.docker\\daemon.json',
    restartCommand: 'Restart-Service docker',
    instructions: [
      '1. 打开 PowerShell 或命令提示符（以管理员身份）',
      '2. 编辑配置文件: notepad %USERPROFILE%\\.docker\\daemon.json',
      '3. 添加或修改 registry-mirrors 配置',
      '4. 保存文件并重启 Docker 服务',
      '5. 运行命令: Restart-Service docker'
    ]
  },
  mac: {
    name: 'macOS',
    daemonPath: '/Applications/Docker.app/Contents/MacOS/Docker',
    configPath: '~/.docker/daemon.json',
    restartCommand: 'killall Docker && open /Applications/Docker.app',
    instructions: [
      '1. 打开终端',
      '2. 编辑配置文件: nano ~/.docker/daemon.json',
      '3. 添加或修改 registry-mirrors 配置',
      '4. 保存文件 (Ctrl+X, Y, Enter)',
      '5. 重启 Docker: killall Docker && open /Applications/Docker.app'
    ]
  },
  linux: {
    name: 'Linux',
    daemonPath: '/usr/bin/dockerd',
    configPath: '/etc/docker/daemon.json',
    restartCommand: 'sudo systemctl restart docker',
    instructions: [
      '1. 打开终端',
      '2. 编辑配置文件: sudo nano /etc/docker/daemon.json',
      '3. 添加或修改 registry-mirrors 配置',
      '4. 保存文件 (Ctrl+X, Y, Enter)',
      '5. 重启 Docker: sudo systemctl restart docker'
    ]
  }
}

export function generateDaemonConfig(mirrors: string[]): string {
  const config = {
    'registry-mirrors': mirrors,
    'max-concurrent-downloads': 10,
    'max-concurrent-uploads': 5,
    'max-download-attempts': 3
  }

  return JSON.stringify(config, null, 2)
}

export function getDockerConfigCommand(platform: Platform, mirrors: string[]): string {
  const config = generateDaemonConfig(mirrors)
  const platformConfig = platformConfigs[platform]

  switch (platform) {
    case 'windows':
      return `echo '${config.replace(/'/g, '"')}' > ${platformConfig.configPath.replace('%USERPROFILE%', '%USERPROFILE%')}`
    case 'mac':
      return `cat > ${platformConfig.configPath} << 'EOF'\n${config}\nEOF`
    case 'linux':
      return `sudo bash -c 'cat > ${platformConfig.configPath} << EOF\n${config}\nEOF'`
    default:
      return ''
  }
}

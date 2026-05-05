# Mac 应用签名错误代码对照表

## 常见错误

### -8183 (CSSMERR_TP_INVALID_CERTIFICATE)
**含义**: Provisioning Profile 解码失败或证书无效

**原因**:
1. GitHub Secret 为空或格式错误
2. Base64 编码损坏
3. 证书过期或被撤销

**解决方案**:
```bash
# 1. 检查 Secret 是否设置
echo $PROVISIONING_PROFILE | head -c 50

# 2. 验证 Base64 编码
openssl base64 -d -in profile.b64 -out test.mobileprovision

# 3. 检查证书有效性
security cms -D -i test.mobileprovision | grep -A2 DeveloperCertificates
```

---

### errSecInternalComponent
**含义**: 钥匙串访问组件错误

**原因**:
1. 钥匙串被锁定
2. 权限不足
3. 证书未导入登录钥匙串

**解决方案**:
```bash
# 解锁钥匙串
security unlock-keychain -p "$KEYCHAIN_PASSWORD" ~/Library/Keychains/login.keychain-db

# 导入证书
security import certificate.p12 -P "$CERTIFICATE_PASSWORD" -k ~/Library/Keychains/login.keychain-db -T /usr/bin/codesign

# 允许 codesign 访问
security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k "$KEYCHAIN_PASSWORD" ~/Library/Keychains/login.keychain-db
```

---

### no identity found
**含义**: 找不到匹配的签名身份

**原因**:
1. 证书未安装
2. Team ID 不匹配
3. Bundle ID 与 Provisioning Profile 不匹配

**解决方案**:
```bash
# 查看可用签名身份
security find-identity -v -p codesigning

# 检查 Provisioning Profile 中的 Team ID
security cms -D -i embedded.mobileprovision | grep -A1 TeamIdentifier

# 检查 Bundle ID 匹配
security cms -D -i embedded.mobileprovision | grep -A1 application-identifier
```

---

### CSSMERR_TP_CERT_REVOKED
**含义**: 证书被撤销

**原因**:
1. 证书被手动撤销
2. 开发者账号过期
3. 证书被新证书替换

**解决方案**:
1. 登录 Apple Developer Portal
2. 检查证书状态
3. 重新生成证书和 Provisioning Profile
4. 更新 GitHub Secrets

---

## 推荐 GitHub Actions 配置

```yaml
name: Build and Sign

on: [push]

jobs:
  build:
    runs-on: macos-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install Dependencies
      run: npm ci
    
    - name: Setup Signing
      if: github.ref == 'refs/heads/main'
      env:
        MAC_CERTIFICATE: ${{ secrets.MAC_CERTIFICATE }}
        MAC_CERTIFICATE_PASSWORD: ${{ secrets.MAC_CERTIFICATE_PASSWORD }}
        PROVISIONING_PROFILE: ${{ secrets.PROVISIONING_PROFILE }}
        KEYCHAIN_PASSWORD: ${{ secrets.KEYCHAIN_PASSWORD }}
      run: |
        # 创建临时钥匙串
        security create-keychain -p "$KEYCHAIN_PASSWORD" build.keychain
        security default-keychain -s build.keychain
        security unlock-keychain -p "$KEYCHAIN_PASSWORD" build.keychain
        security set-keychain-settings -t 3600 -u build.keychain
        
        # 导入证书
        echo "$MAC_CERTIFICATE" | base64 --decode > certificate.p12
        security import certificate.p12 -P "$MAC_CERTIFICATE_PASSWORD" -k build.keychain -T /usr/bin/codesign
        security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k "$KEYCHAIN_PASSWORD" build.keychain
        
        # 导入 Provisioning Profile
        mkdir -p ~/Library/MobileDevice/Provisioning\ Profiles
        echo "$PROVISIONING_PROFILE" | base64 --decode > ~/Library/MobileDevice/Provisioning\ Profiles/build.mobileprovision
    
    - name: Build
      run: npm run build
      env:
        SIGN: ${{ github.ref == 'refs/heads/main' && 'true' || 'false' }}
    
    - name: Upload Artifact
      uses: actions/upload-artifact@v3
      with:
        name: app
        path: dist/
```

---

## Ad-hoc 签名（备用方案）

当正式签名失败时，使用 ad-hoc 签名进行测试：

```bash
# Ad-hoc 签名（无开发者账号）
codesign --deep --force --verify --verbose --sign "-" "YourApp.app"

# 验证签名
codesign -dv --verbose=4 "YourApp.app"

# 检查是否可运行
spctl -a -t exec -vv "YourApp.app"
```

注意：Ad-hoc 签名无法在 App Store 分发，仅供测试使用。

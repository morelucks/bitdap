# Security Guidelines for Bitdap

## 🔒 Private Key Security

### ✅ Current Security Status

- ✅ **No hardcoded private keys** in source code
- ✅ **Sensitive files are gitignored** (`.env`, `settings/Mainnet.toml`, `settings/Testnet.toml`)
- ✅ **All scripts require environment variables** for private keys
- ✅ **No sensitive files tracked in git history**

### 🛡️ Best Practices

#### 1. **Never Hardcode Private Keys**
   - ❌ **BAD**: `const key = "4dcad13c..."`
   - ✅ **GOOD**: `const key = process.env.MAINNET_PRIVATE_KEY`

#### 2. **Use Environment Variables**
   ```bash
   # Set in your shell session
   export MAINNET_PRIVATE_KEY="your-key-here"
   
   # Or use .env file (already gitignored)
   echo 'MAINNET_PRIVATE_KEY="your-key-here"' >> .env
   ```

#### 3. **Never Commit Sensitive Files**
   Files automatically ignored by `.gitignore`:
   - `**/settings/Mainnet.toml`
   - `**/settings/Testnet.toml`
   - `.env`
   - `*.key`, `*.pem`, `*.secret`
   - `secrets/` directory

#### 4. **Verify Before Committing**
   ```bash
   # Check what will be committed
   git status
   
   # Search for potential secrets
   git diff | grep -i "private\|key\|mnemonic\|secret"
   ```

#### 5. **If You Accidentally Commit a Key**
   ```bash
   # 1. IMMEDIATELY rotate the key (generate new one)
   # 2. Remove from git history (if recent)
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch settings/Mainnet.toml" \
     --prune-empty --tag-name-filter cat -- --all
   
   # 3. Force push (WARNING: This rewrites history)
   # git push origin --force --all
   ```

## 🔐 Deployment Security

### Mainnet Deployment
```bash
# Always use environment variable
export MAINNET_PRIVATE_KEY="your-mainnet-private-key"
npx tsx scripts/deploy-mainnet.ts
```

### Testnet Deployment
```bash
# Use testnet mnemonic from environment
export TESTNET_MNEMONIC="your 24-word testnet seed phrase"
./deploy-testnet.sh
```

## 📋 Security Checklist

Before deploying to mainnet:

- [ ] Verify no private keys in source code: `grep -r "privateKey.*=" scripts/ contracts/`
- [ ] Verify `.gitignore` includes all sensitive files
- [ ] Check git status: `git status` (no sensitive files should appear)
- [ ] Verify environment variable is set: `echo $MAINNET_PRIVATE_KEY`
- [ ] Use a dedicated deployment account (not your main wallet)
- [ ] Keep deployment keys separate from operational keys
- [ ] Use a hardware wallet for high-value operations

## 🚨 If Your Key is Compromised

1. **Immediately** transfer all funds to a new secure address
2. **Rotate** the compromised key (generate new one)
3. **Review** git history to see if key was committed
4. **Update** all scripts/configs to use new key
5. **Monitor** the old address for unauthorized transactions

## 📝 Script Security

All deployment scripts now:
- ✅ Require environment variables (no hardcoded fallbacks)
- ✅ Display clear error messages if key is missing
- ✅ Never log private keys to console
- ✅ Use secure network connections (HTTPS only)

## 🔍 Regular Security Audits

Run these commands periodically:

```bash
# Search for potential secrets in code
grep -r "privateKey.*=" --include="*.ts" --include="*.js" --include="*.toml" .

# Check git for any committed secrets
git log --all --full-history -p | grep -i "private\|key\|mnemonic"

# Verify .gitignore is working
git status --ignored
```

---

**Remember**: Security is an ongoing process. Always be vigilant about protecting your private keys!


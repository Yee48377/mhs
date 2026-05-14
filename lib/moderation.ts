const BANNED_PATTERNS = [
  { label: "傻逼", pattern: /傻[\s\W_]*逼|煞[\s\W_]*笔|沙[\s\W_]*比/u },
  { label: "死妈", pattern: /死[\s\W_]*妈|你[\s\W_]*妈|妈[\s\W_]*的/u },
  { label: "操你", pattern: /操[\s\W_]*你|草[\s\W_]*你|草[\s\W_]*泥[\s\W_]*马/u },
  { label: "滚你妈", pattern: /滚[\s\W_]*你[\s\W_]*妈/u },
  { label: "废物", pattern: /废[\s\W_]*物/u },
  { label: "贱人", pattern: /贱[\s\W_]*人|贱[\s\W_]*货/u },
  { label: "狗东西", pattern: /狗[\s\W_]*东[\s\W_]*西/u },
  { label: "脑残", pattern: /脑[\s\W_]*残/u },
  { label: "弱智", pattern: /弱[\s\W_]*智/u },
  { label: "畜生", pattern: /畜[\s\W_]*生/u },
  { label: "婊子", pattern: /婊[\s\W_]*子/u },
  { label: "去死", pattern: /去[\s\W_]*死/u }
] as const;

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[~`!@#$%^&*()\-_=+\[\]{};:'",.<>/?\\|，。！？、】【（）【】《》、\s]+/g, "");
}

export function containsBannedTerms(...values: string[]) {
  const merged = normalizeText(values.join(" "));

  for (const item of BANNED_PATTERNS) {
    if (item.pattern.test(merged)) {
      return item.label;
    }
  }

  return null;
}

(() => {
  const empty = "";
  try {
    Object.defineProperty(Document.prototype, "cookie", {
      configurable: true,
      get() { return empty; },
      set() {}
    });
  } catch (_) {}
  try {
    if (window.cookieStore) {
      const deny = () => Promise.resolve(undefined);
      window.cookieStore.set = deny;
      window.cookieStore.delete = deny;
      window.cookieStore.get = () => Promise.resolve(null);
      window.cookieStore.getAll = () => Promise.resolve([]);
    }
  } catch (_) {}
})();

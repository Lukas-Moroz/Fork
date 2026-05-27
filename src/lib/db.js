export const db = globalThis.__B44_DB__ || {
  auth: { isAuthenticated: async () => false, me: async () => null },
  entities: new Proxy({}, {
    get: () => ({
      filter: async () => [],
      get: async () => null,
      create: async () => ({}),
      update: async () => ({}),
      delete: async () => ({}),
      subscribe: () => () => {},
    }),
  }),
  integrations: {
    Core: {
      UploadFile: async () => ({ file_url: '' }),
      SendEmail: async () => {},
      InvokeLLM: async () => ({}),
    },
  },
};

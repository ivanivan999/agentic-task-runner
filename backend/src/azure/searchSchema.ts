export const EMBEDDING_DIMENSIONS = 1536;

export const buildIndexDefinition = (name: string) => ({
  name,
  fields: [
    { name: "id", type: "Edm.String", key: true, filterable: true },
    {
      name: "lesson",
      type: "Edm.Int32",
      filterable: true,
      sortable: true,
      facetable: true,
    },
    { name: "title", type: "Edm.String", searchable: true, filterable: true },
    {
      name: "pdfPage",
      type: "Edm.Int32",
      filterable: true,
      sortable: true,
    },
    {
      name: "contentType",
      type: "Edm.String",
      searchable: true,
      filterable: true,
      facetable: true,
    },
    { name: "text", type: "Edm.String", searchable: true },
    {
      name: "contentVector",
      type: "Collection(Edm.Single)",
      searchable: true,
      retrievable: false,
      dimensions: EMBEDDING_DIMENSIONS,
      vectorSearchProfile: "lesson-vector-profile",
    },
  ],
  vectorSearch: {
    algorithms: [
      {
        name: "lesson-hnsw",
        kind: "hnsw",
        hnswParameters: {
          metric: "cosine",
          m: 4,
          efConstruction: 400,
          efSearch: 500,
        },
      },
    ],
    profiles: [
      {
        name: "lesson-vector-profile",
        algorithm: "lesson-hnsw",
      },
    ],
  },
});

export const lessonFilter = (lesson?: number): string | undefined =>
  lesson === undefined ? undefined : `lesson eq ${lesson}`;

// Market Insights - Adobe Stock Mock Data
// Using mock data for now (real RapidAPI integration will replace this)

interface RapidAPIAsset {
  id: string;
  title: string;
  thumbnail: string;
  previewUrl?: string;
  category?: string;
  keywords?: string[];
  downloads?: number;
  sales?: number;
  uploadedDate?: string;
  contributor?: string;
  contributorId?: string;
  fileType?: string;
  popularity?: number;
}

interface RapidAPISearchResponse {
  results: RapidAPIAsset[];
  totalFound: number;
  queryTime: number;
}

// Mock data for demonstration
const MOCK_ASSETS: RapidAPIAsset[] = [
  {
    id: "123456789",
    title: "Modern Urban Landscape",
    thumbnail: "https://via.placeholder.com/160x90?text=Urban+Landscape",
    category: "Photography",
    keywords: ["urban", "landscape", "city", "modern"],
    downloads: 5420,
    sales: 1200,
    uploadedDate: "2026-03-15",
    contributor: "John Smith",
    contributorId: "john-smith-123",
    fileType: "JPEG",
    popularity: 95,
  },
  {
    id: "987654321",
    title: "Abstract Watercolor Painting",
    thumbnail: "https://via.placeholder.com/160x90?text=Watercolor",
    category: "Illustration",
    keywords: ["abstract", "watercolor", "art", "painting"],
    downloads: 3200,
    sales: 850,
    uploadedDate: "2026-03-10",
    contributor: "Jane Doe",
    contributorId: "jane-doe-456",
    fileType: "PNG",
    popularity: 87,
  },
  {
    id: "456789123",
    title: "Nature Wildlife Photography",
    thumbnail: "https://via.placeholder.com/160x90?text=Wildlife",
    category: "Photography",
    keywords: ["nature", "wildlife", "animal", "forest"],
    downloads: 4100,
    sales: 960,
    uploadedDate: "2026-03-05",
    contributor: "Mike Johnson",
    contributorId: "mike-j-789",
    fileType: "JPEG",
    popularity: 92,
  },
  {
    id: "789123456",
    title: "Minimalist Design Elements",
    thumbnail: "https://via.placeholder.com/160x90?text=Minimalist",
    category: "Graphics",
    keywords: ["minimalist", "design", "simple", "graphic"],
    downloads: 2800,
    sales: 720,
    uploadedDate: "2026-02-28",
    contributor: "Sarah Wilson",
    contributorId: "sarah-w-101",
    fileType: "AI",
    popularity: 84,
  },
  {
    id: "321654987",
    title: "Business Team Meeting",
    thumbnail: "https://via.placeholder.com/160x90?text=Business",
    category: "Photography",
    keywords: ["business", "team", "meeting", "corporate"],
    downloads: 3900,
    sales: 890,
    uploadedDate: "2026-02-20",
    contributor: "David Brown",
    contributorId: "david-b-202",
    fileType: "JPEG",
    popularity: 88,
  },
];

/**
 * Search Adobe Stock assets (Mock data)
 */
export async function searchAssetsRapidAPI(
  query: string,
  options?: {
    limit?: number;
    offset?: number;
    filters?: Record<string, string>;
  }
): Promise<RapidAPISearchResponse | null> {
  try {
    const limit = Math.min(options?.limit || 50, 200);
    const offset = options?.offset || 0;

    // Filter mock data based on query
    let filtered = MOCK_ASSETS;
    if (query && query !== "trending") {
      filtered = MOCK_ASSETS.filter(
        (asset) =>
          asset.title.toLowerCase().includes(query.toLowerCase()) ||
          asset.keywords?.some((k) => k.toLowerCase().includes(query.toLowerCase()))
      );
    }

    // Slice for pagination
    const results = filtered.slice(offset, offset + limit);

    return {
      results,
      totalFound: filtered.length,
      queryTime: Math.random() * 500, // Simulate query time
    };
  } catch (error) {
    console.error("Mock API search error:", error);
    return null;
  }
}

/**
 * Get trending assets from market
 */
export async function getTrendingAssets(limit: number = 50): Promise<RapidAPIAsset[]> {
  const response = await searchAssetsRapidAPI("trending", {
    limit,
    filters: {
      order: "nb_downloads",
      search_type: "all",
    },
  });
  return response?.results || [];
}

/**
 * Get top assets by category
 */
export async function getTopAssetsByCategory(
  category: string,
  limit: number = 50
): Promise<RapidAPIAsset[]> {
  const response = await searchAssetsRapidAPI(category, {
    limit,
    filters: {
      order: "nb_downloads",
      filters: `[content_type:photo],[content_type:illustration]`,
    },
  });
  return response?.results || [];
}

/**
 * Get most popular keywords
 */
export async function getPopularKeywords(): Promise<Record<string, number>> {
  try {
    // This would fetch from RapidAPI if they have a keywords endpoint
    // For now, we'll use a simple trending search
    const trendingAssets = await getTrendingAssets(200);
    const keywordMap: Record<string, number> = {};

    trendingAssets.forEach((asset) => {
      if (asset.keywords && Array.isArray(asset.keywords)) {
        asset.keywords.forEach((keyword) => {
          keywordMap[keyword] = (keywordMap[keyword] || 0) + 1;
        });
      }
    });

    // Sort by frequency
    const sorted = Object.entries(keywordMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50)
      .reduce(
        (acc, [keyword, count]) => {
          acc[keyword] = count;
          return acc;
        },
        {} as Record<string, number>
      );

    return sorted;
  } catch (error) {
    console.error("Error fetching popular keywords:", error);
    return {};
  }
}

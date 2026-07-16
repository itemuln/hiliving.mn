export type NewsArticle = {
  id: string;
  slug: string;
  title: string;
  description: string;
  image: string;
};

const articleCount = 15;

export const newsArticles: NewsArticle[] = Array.from({ length: articleCount }, (_, index) => ({
  id: `news-${index + 1}`,
  slug: `meaning-of-lorem-ipsum-${index + 1}`,
  title: 'Meaning of Lorem Ipsum',
  description: 'Lorem ipsum was purposefully designed to have no meaning',
  image: '/news-team.svg',
}));

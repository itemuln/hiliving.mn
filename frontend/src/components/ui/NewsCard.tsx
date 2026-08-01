export interface NewsCardProps {
  readonly item: {
    readonly id: string;
    readonly title: string;
    readonly description: string;
    readonly image: string;
  };
}

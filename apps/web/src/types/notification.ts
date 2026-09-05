export type NotificationType = "PRICE_DROP" | "PRICE_INCREASE" | "TARGET_REACHED" | "SYSTEM";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  userProductId?: string;
  userProduct?: {
    id: string;
    product: {
      id: string;
      name: string | null;
      url: string;
      platform: string;
    };
  };
}

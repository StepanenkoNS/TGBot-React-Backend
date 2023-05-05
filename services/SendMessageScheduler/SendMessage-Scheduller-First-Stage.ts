import { TextHelper } from '/opt/TextHelpers/textHelper';
import { MessagingBotSubscriptionManager } from '/opt/MessagingBotSubscriptionManager';

export async function handler(): Promise<any> {
    await MessagingBotSubscriptionManager.SchedullerFirstStage();
}

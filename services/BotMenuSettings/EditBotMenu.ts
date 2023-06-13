import { TextHelper } from '/opt/TextHelpers/textHelper';
import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

import { TelegramUserFromAuthorizer } from '/opt/AuthTypes';

//@ts-ignore
import { SetOrigin } from '/opt/LambdaHelpers/OriginHelper';
//@ts-ignore
import { ValidateIncomingEventBody } from '/opt/LambdaHelpers/ValidateIncomingData';
//@ts-ignore
import { ParseItemResult, ReturnRestApiResult } from '/opt/LambdaHelpers/ReturnRestApiResult';
//@ts-ignore
import { ETelegramBotCommand, IBotMenuSettings, IMessagingBotCommand } from '/opt/MessagingBotManagerTypes';
//@ts-ignore
import { MessagingBotManager } from '/opt/MessagingBotManager';
import { IBotGeneralKey, IGeneralItemKey } from '/opt/GeneralTypes';
import { BotMenuSettings } from '/opt/BotMenuSettings';
import { SchemaValidator } from '/opt/YUP/SchemaValidator';

export async function handler(event: APIGatewayEvent): Promise<APIGatewayProxyResult> {
    const origin = SetOrigin(event);

    const telegramUser = event.requestContext.authorizer as TelegramUserFromAuthorizer;
    let renewedToken = undefined;

    if (event?.requestContext?.authorizer?.renewedAccessToken) {
        renewedToken = event.requestContext.authorizer.renewedAccessToken as string;
    }
    let bodyObject = ValidateIncomingEventBody(event, [
        { key: 'botId', datatype: 'number(positiveInteger)' },
        { key: 'subscriptionsMenu', datatype: 'object', objectKeys: [] },
        { key: 'digitalStoreMenu', datatype: 'object', objectKeys: [] },
        { key: 'meetingsMenu', datatype: 'object', objectKeys: [] },
        { key: 'feedBackMenu', datatype: 'object', objectKeys: [] },
        { key: 'languageMenu', datatype: 'object', objectKeys: [] }
    ]);
    if (bodyObject.success === false) {
        return await ReturnRestApiResult({
            statusCode: 422,
            method: 'UPDATE',
            masterId: Number(telegramUser.id),
            data: { error: bodyObject.error },
            withMapReplacer: false,
            origin: origin,
            renewedAccessToken: renewedToken
        });
    }

    const potentialCommand: IBotMenuSettings = {
        masterId: Number(telegramUser.id),
        botId: Number(TextHelper.SanitizeToDirectText(bodyObject.data.botId)),
        subscriptionsMenu: bodyObject.data.subscriptionsMenu,
        digitalStoreMenu: bodyObject.data.digitalStoreMenu,
        meetingsMenu: bodyObject.data.meetingsMenu,
        feedBackMenu: bodyObject.data.feedBackMenu,
        languageMenu: bodyObject.data.languageMenu
    };

    const schemaValidationResult = await SchemaValidator.BotMenuSettings_Validator(potentialCommand);
    if (schemaValidationResult.success == false || !schemaValidationResult.item) {
        return await ReturnRestApiResult({
            statusCode: 422,
            method: 'UPDATE',
            masterId: Number(telegramUser.id),
            data: { error: schemaValidationResult.error },
            withMapReplacer: false,
            origin: origin,
            renewedAccessToken: renewedToken
        });
    }

    const result = await BotMenuSettings.UpdateBotMenu(schemaValidationResult.item as any);

    const dataResult = ParseItemResult(result);

    return await ReturnRestApiResult({
        statusCode: dataResult.code,
        method: 'UPDATE',
        masterId: Number(telegramUser.id),
        data: dataResult.body,
        withMapReplacer: false,
        origin: origin,
        renewedAccessToken: renewedToken
    });
}

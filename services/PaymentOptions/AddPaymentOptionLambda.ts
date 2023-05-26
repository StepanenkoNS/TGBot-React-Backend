import { TextHelper } from '/opt/TextHelpers/textHelper';
import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

import { TelegramUserFromAuthorizer } from '/opt/AuthTypes';

import { EPaymentOptionType, IPaymentOptionDirectCardTransfer, IPaymentOptionPaymentIntegration } from '/opt/PaymentTypes';
//@ts-ignore
import { SetOrigin } from '/opt/LambdaHelpers/OriginHelper';
//@ts-ignore
import { ValidateIncomingEventBody, ValidateStringParameters } from '/opt/LambdaHelpers/ValidateIncomingData';
//@ts-ignore
import { ParseItemResult, ReturnRestApiResult } from '/opt/LambdaHelpers/ReturnRestApiResult';

import { PaymentOptionsManager } from '/opt/PaymentOptionsManager';
import { ItemResponse } from '/opt/GeneralTypes';

export async function handler(event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> {
    const origin = SetOrigin(event);

    const telegramUser = event.requestContext.authorizer as TelegramUserFromAuthorizer;
    let renewedToken = undefined;

    if (event?.requestContext?.authorizer?.renewedAccessToken) {
        renewedToken = event.requestContext.authorizer.renewedAccessToken as string;
    }
    let bodyObject = ValidateIncomingEventBody(event, [
        { key: 'botId', datatype: 'number(positiveInteger)' },
        { key: 'name', datatype: 'string' },
        { key: 'type', datatype: ['DIRECT', 'INTEGRATION'] },
        { key: 'description', datatype: 'string' },
        { key: 'currency', datatype: 'string' }
    ]);
    if (bodyObject.success === false) {
        return ReturnRestApiResult(422, { success: false, error: bodyObject.error }, false, origin, renewedToken);
    }

    if (bodyObject.data.type === 'INTEGRATION') {
        bodyObject = ValidateIncomingEventBody(event, [{ key: 'token', datatype: 'string' }]);
        if (bodyObject.success === false) {
            return ReturnRestApiResult(422, { success: false, error: bodyObject.error }, false, origin, renewedToken);
        }
    }

    if (bodyObject.data.type === 'DIRECT') {
        const data: IPaymentOptionDirectCardTransfer = {
            masterId: Number(telegramUser.id),
            botId: Number(TextHelper.SanitizeToDirectText(bodyObject.data.botId)),
            discriminator: 'IPaymentOptionDirectCardTransfer',
            name: TextHelper.SanitizeToDirectText(bodyObject.data.name),
            type: EPaymentOptionType.DIRECT,
            currency: TextHelper.SanitizeToDirectText(bodyObject.data.currency) as any,
            description: TextHelper.RemoveUnsupportedHTMLTags(bodyObject.data.description)
        };
        const result = await PaymentOptionsManager.AddDirectPaymentOption(data);
        const addResult = ParseItemResult(result);
        return ReturnRestApiResult(addResult.code, addResult.body, false, origin, renewedToken);
    }
    if (bodyObject.data.type === 'INTEGRATION') {
        const result = await PaymentOptionsManager.AddIntegrationPaymentOption({
            masterId: Number(telegramUser.id),
            botId: Number(TextHelper.SanitizeToDirectText(bodyObject.data.botId)),
            discriminator: 'IPaymentOptionPaymentIntegration',
            name: TextHelper.SanitizeToDirectText(bodyObject.data.name),
            type: EPaymentOptionType.INTEGRATION,
            token: TextHelper.SanitizeToDirectText(bodyObject.data.token),
            currency: TextHelper.SanitizeToDirectText(bodyObject.data.currency) as any,
            description: TextHelper.RemoveUnsupportedHTMLTags(bodyObject.data.description)
        });
        const addResult = ParseItemResult(result);
        return ReturnRestApiResult(addResult.code, addResult.body, false, origin, renewedToken);
    }
    const mockResult = ParseItemResult(undefined);
    return ReturnRestApiResult(mockResult.code, mockResult.body, false, origin, renewedToken);
}

import { TextHelper } from '/opt/TextHelpers/textHelper';
import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
//@ts-ignore
import { SetOrigin } from '/opt/LambdaHelpers/OriginHelper';
//@ts-ignore
import { ValidateIncomingEventBody } from '/opt/LambdaHelpers/ValidateIncomingData';
//@ts-ignore
import { ParseItemResult, ReturnRestApiResult } from '/opt/LambdaHelpers/ReturnRestApiResult';
import { TelegramUserFromAuthorizer } from 'tgbot-project-types/TypesCompiled/AuthTypes';

import { IPaymentOption } from 'tgbot-project-types/TypesCompiled/PaymentTypes';

import { PaymentOptionsManager } from '/opt/PaymentOptionsManager';
//@ts-ignore
import { SchemaValidator } from '/opt/YUP/SchemaValidator';

export async function handler(event: APIGatewayEvent): Promise<APIGatewayProxyResult> {
    console.log(event);
    const origin = SetOrigin(event);

    const telegramUser = event.requestContext.authorizer as TelegramUserFromAuthorizer;
    let renewedToken = undefined;

    if (event?.requestContext?.authorizer?.renewedAccessToken) {
        renewedToken = event.requestContext.authorizer.renewedAccessToken as string;
    }

    let bodyObject = ValidateIncomingEventBody(event, [
        { key: 'id', datatype: 'string' },
        { key: 'name', datatype: 'string' },
        { key: 'botId', datatype: 'number(positiveInteger)' },
        { key: 'type', datatype: 'object', objectKeys: [] },
        { key: 'currency', datatype: 'string' }
    ]);
    if (bodyObject.success === false) {
        return await ReturnRestApiResult({
            statusCode: 422,
            method: 'EDIT',
            masterId: Number(telegramUser.id),
            data: { success: false, error: bodyObject.error },

            origin: origin,
            renewedAccessToken: renewedToken
        });
    }

    const potentialPaymentOption: IPaymentOption = {
        id: bodyObject.data.id,
        masterId: Number(telegramUser.id),
        botId: Number(TextHelper.SanitizeToDirectText(bodyObject.data.botId)),
        name: TextHelper.SanitizeToDirectText(bodyObject.data.name),
        type: bodyObject.data.type,
        currency: TextHelper.SanitizeToDirectText(bodyObject.data.currency) as any
    };

    const schemaValidationResult = await SchemaValidator.PaymentOption_Validator(potentialPaymentOption);
    if (schemaValidationResult.success == false || !schemaValidationResult.item) {
        return await ReturnRestApiResult({
            statusCode: 422,
            method: 'EDIT',
            masterId: Number(telegramUser.id),
            data: { success: false, error: schemaValidationResult.error },

            origin: origin,
            renewedAccessToken: renewedToken
        });
    }

    const result = await PaymentOptionsManager.EditPaymentOption(schemaValidationResult.item as any);

    const dataResult = ParseItemResult(result);

    return await ReturnRestApiResult({
        statusCode: dataResult.code,
        method: 'EDIT',
        masterId: Number(telegramUser.id),
        data: dataResult.body,

        origin: origin,
        renewedAccessToken: renewedToken
    });
}

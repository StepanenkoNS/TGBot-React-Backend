import { TextHelper } from '/opt/TextHelpers/textHelper';

import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

import { TelegramUserFromAuthorizer } from '/opt/AuthTypes';

import { EPaymentType, IPaymentOptionDirectCardTransfer, IPaymentOptionPaymentIntegration, SupportedCurrenciesArray } from '/opt/PaymentTypes';
//@ts-ignore
import { SetOrigin } from '/opt/LambdaHelpers/OriginHelper';
//@ts-ignore
import { ValidateIncomingEventBody, ValidateStringParameters } from '/opt/LambdaHelpers/ValidateIncomingData';
//@ts-ignore
import { ParseInsertItemResult, ReturnRestApiResult } from '/opt/LambdaHelpers/ReturnRestApiResult';

//@ts-ignore
import { MasterManager } from '/opt/MasterManager';

export async function handler(event: APIGatewayEvent): Promise<APIGatewayProxyResult> {
    console.log(event);

    const origin = SetOrigin(event);

    const telegramUser = event.requestContext.authorizer as TelegramUserFromAuthorizer;
    let renewedToken = undefined;

    if (event?.requestContext?.authorizer?.renewedAccessToken) {
        renewedToken = event.requestContext.authorizer.renewedAccessToken as string;
    }
    let bodyObject = ValidateIncomingEventBody(event, [
        { key: 'lengthInDays', datatype: 'number(positiveInteger)' },
        { key: 'subscriptionPlan', datatype: ['PAIDCHANNEL', 'PAIDBOT'] },
        { key: 'subscriptionLevel', datatype: 'number(positiveInteger)' },
        { key: 'pricePaid', datatype: 'number(positiveInteger)' },
        { key: 'currency', datatype: SupportedCurrenciesArray }
    ]);
    if (bodyObject.success === false) {
        return ReturnRestApiResult(422, { success: false, error: bodyObject.error }, false, origin, renewedToken);
    }

    let result = false;
    if (Number(telegramUser.id) === 199163834) {
        result = await MasterManager.AddSubscription({
            masterId: Number(telegramUser.id),
            lengthInDays: Number(TextHelper.SanitizeToDirectText(bodyObject.data.lengthInDays)),
            subscriptionPlan: TextHelper.SanitizeToDirectText(bodyObject.data.subscriptionPlan) as any,
            subscriptionLevel: Number(TextHelper.SanitizeToDirectText(bodyObject.data.subscriptionLevel)),
            pricePaid: Number(TextHelper.SanitizeToDirectText(bodyObject.data.pricePaid)),
            currency: TextHelper.SanitizeToDirectText(bodyObject.data.currency) as any
        });
    }

    const addResult = ParseInsertItemResult(result);
    return ReturnRestApiResult(addResult.code, addResult.body, false, origin, renewedToken);
}

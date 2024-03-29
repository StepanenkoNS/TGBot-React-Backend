import { TextHelper } from '/opt/TextHelpers/textHelper';
import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

import { defaultMenuLanguage, ESupportedLanguage } from 'tgbot-project-types/TypesCompiled/LocaleTypes';
import { ReturnArticlesAsArray, ReturnArticlesMapFromDB, ReturnCategoriesAsArray, ReturnCategoriesMapFromDB } from '/opt/LambdaHelpers/HCHelper';
import { SetOrigin } from '/opt/LambdaHelpers/OriginHelper';
import { ReturnBlankApiResult, ReturnRestApiResult } from '/opt/LambdaHelpers/ReturnRestApiResult';

type Page = {
    pagePath: string;
    locale: ESupportedLanguage;
    itemName?: string;
    pageId?: string;
};
const fallbackLocale = defaultMenuLanguage;

export async function handler(event: APIGatewayEvent): Promise<APIGatewayProxyResult> {
    const origin = SetOrigin(event);

    try {
        let locale: string | undefined;
        const queryParams = event.queryStringParameters;
        if (queryParams) {
            locale = !queryParams['locale'] ? fallbackLocale : queryParams['locale'];
        } else {
            locale = fallbackLocale;
        }
        const mapArticles = await ReturnArticlesMapFromDB(locale);
        const mapCategories = await ReturnCategoriesMapFromDB(locale, mapArticles);

        const articlesArray = ReturnArticlesAsArray(mapArticles);
        const categoriesArray = ReturnCategoriesAsArray(mapCategories, mapArticles);
        const popularArticlesArray = articlesArray
            .sort((a, b) => {
                if (a.viewCount < b.viewCount) return 1;
                if (a.viewCount > b.viewCount) return -1;
                return 0;
            })
            .slice(0, 5);

        for (const popularArticle of popularArticlesArray) {
            let flag = false;
            for (const category of categoriesArray) {
                if (flag) {
                    break;
                }
                for (const subCategory of category.subCategories) {
                    if (flag) {
                        break;
                    }
                    for (const article of subCategory.articles) {
                        if (flag) {
                            break;
                        }
                        if (article.slug === popularArticle.slug) {
                            popularArticle.path = category.slug + '/' + subCategory.slug;
                            flag = true;
                        }
                    }
                }
            }
            if (!popularArticle.path) {
                popularArticle.path = '';
            }
        }
        const ResultObject = { categories: categoriesArray, allArticles: articlesArray, popularArticles: popularArticlesArray };

        return ReturnBlankApiResult(200, { success: true, data: ResultObject }, origin);
    } catch (error) {
        console.log('DynamoDB error\n', error);

        return ReturnBlankApiResult(422, { success: false, error: 'DB error' }, origin);
    }
}

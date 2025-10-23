export function isSQSEvent(event: any): boolean {
    return event.Records && event.Records[0] && event.Records[0].eventSource === 'aws:sqs';
}
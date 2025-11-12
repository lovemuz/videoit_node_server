const SLACK_CHANNEL: {
    CALL_LOG: string,
    PAYMENT_LOG: string,
    CS: string,
    BAN: string,
    VOICE_BAN: string,
    REFUND: string,
    MONEY: string,
    BLOCK: string
} = (function () {
    return {
        CALL_LOG: 'C086HB4NWCE',
        PAYMENT_LOG: 'C0872KXPH1P',
        CS: 'C086PV9196W',
        BAN: 'C0869DPBPB9',
        VOICE_BAN: 'C0872LULF25',
        REFUND: 'C0872L9E6D7',
        MONEY: 'C086HB6KBML',
        BLOCK: 'C087UEJSTQF'
    }
}())

export {
    SLACK_CHANNEL,
}
const USER_ROLE: {
    NORMAL_USER: number,
    ASSIST_USER: Number,
    COMPANY_USER: number,
    BAN_USER: number,
    CS_USER: number,
    ADMIN_USER: number,
    DESTROY_USER: number,
    REFERRAL_USER: number,
    isNormalRole: any,
    isCompanyRole: any,
    isBanRole: any,
    isCsRole: any,
    isAdminRole: any,
    isDestoryRole: any,
    isAssistRole: any,
    isREFERRALRole: any,
} = (function () {
    return {
        // 1 일반 유저 //2 mcn //3 ban //4 cs // 5 관리자
        NORMAL_USER: 1,
        COMPANY_USER: 2,
        BAN_USER: 3,
        CS_USER: 4,
        ADMIN_USER: 5,
        DESTROY_USER: 6,
        ASSIST_USER: 7,
        REFERRAL_USER: 8,
        isNormalRole: (role: number): boolean => USER_ROLE.NORMAL_USER === role,
        isCompanyRole: (role: number): boolean => USER_ROLE.COMPANY_USER === role,
        isBanRole: (role: number): boolean => USER_ROLE.BAN_USER === role,
        isCsRole: (role: number): boolean => USER_ROLE.CS_USER === role,
        isAdminRole: (role: number): boolean => USER_ROLE.ADMIN_USER === role,
        isDestoryRole: (role: number): boolean => USER_ROLE.ADMIN_USER === role,
        isAssistRole: (role: number): boolean => USER_ROLE.ASSIST_USER === role,
        isREFERRALRole: (role: number): boolean => USER_ROLE.REFERRAL_USER === role,
    }
}())

const USER_ATTRIBUTE: {
    EXCLUDE: any
    EXCLUDE2: any
    EXCLUDE_MCN_TEST123: any
} = (function () {
    return {
        EXCLUDE: ['phone', 'email', 'sns', 'snsId', 'password', 'refreshToken', 'real_birthday', 'real_gender'],
        EXCLUDE2: ['phone', 'email', 'sns', 'snsId', 'password', 'real_birthday', 'real_gender'],
        EXCLUDE_MCN_TEST123: ['email', 'sns', 'snsId', 'password']
    }
}())

const USER_GENDER: {
    GIRL: number,
    BOY: number,
    CS: number,
} = (function () {
    return {
        GIRL: 1,
        BOY: 2,
        CS: 3,
    }
}())


export {
    USER_ROLE,
    USER_ATTRIBUTE,
    USER_GENDER
}
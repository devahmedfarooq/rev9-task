export class updateRatelimitDto {
    readonly route: string
    readonly limit: number
    readonly timeWindow: number
    readonly role?: string
}
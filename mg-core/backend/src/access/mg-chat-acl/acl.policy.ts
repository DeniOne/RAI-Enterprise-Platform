/**
 * ACL Mapping Layer — Policy Map
 * 
 * Декларативная карта правил доступа по управленческим контурам.
 * 
 * Принципы:
 * - policy не знает ролей
 * - policy работает по контурам
 * - wildcard — это namespace match, не regex
 * - порядок важен (exact → namespace)
 */

import { ACLPolicy } from "./acl.types";

export const MG_CHAT_ACL_POLICY: ACLPolicy = {
    /**
     * Employee Contour
     * Доступ только к своим данным (self)
     */
    employee: [
        {
            intent: "employee.*",
            allowedScopes: ["self"]
        }
    ],

    /**
     * Manager Contour
     * Доступ к своему подразделению (own_unit) и своим данным (self)
     */
    manager: [
        {
            intent: "manager.*",
            allowedScopes: ["own_unit"]
        },
        {
            intent: "employee.*",
            allowedScopes: ["self"]
        }
    ],

    /**
     * Executive Contour
     * Глобальный доступ (global) и доступ к подразделениям (own_unit)
     */
    exec: [
        {
            intent: "exec.*",
            allowedScopes: ["global"]
        },
        {
            intent: "manager.show_team_overview",
            allowedScopes: ["own_unit"]
        }
    ]
};

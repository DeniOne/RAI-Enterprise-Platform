/**
 * ACL Mapping Layer — Unit Tests
 * 
 * Тесты для resolveACL без окружения (pure function).
 */

import { resolveACL } from "./acl.resolver";
import { AccessContext, ACLPolicy } from "./acl.types";

// Test policy для изолированных тестов
const TEST_POLICY: ACLPolicy = {
    employee: [
        {
            intent: "employee.*",
            allowedScopes: ["self"]
        }
    ],
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

describe("ACL Resolver", () => {
    describe("✅ Positive cases", () => {
        test("employee + employee.show_my_tasks + self → allowed", () => {
            const context: AccessContext = {
                userId: "user1",
                roles: ["EMPLOYEE"],
                contour: "employee",
                scope: "self"
            };

            const decision = resolveACL("employee.show_my_tasks", context, TEST_POLICY);

            expect(decision).toEqual({ allowed: true });
        });

        test("manager + manager.show_shift_status + own_unit → allowed", () => {
            const context: AccessContext = {
                userId: "user2",
                roles: ["MANAGER"],
                contour: "manager",
                scope: "own_unit"
            };

            const decision = resolveACL("manager.show_shift_status", context, TEST_POLICY);

            expect(decision).toEqual({ allowed: true });
        });

        test("exec + exec.show_kpi_summary + global → allowed", () => {
            const context: AccessContext = {
                userId: "user3",
                roles: ["EXECUTIVE"],
                contour: "exec",
                scope: "global"
            };

            const decision = resolveACL("exec.show_kpi_summary", context, TEST_POLICY);

            expect(decision).toEqual({ allowed: true });
        });
    });

    describe("❌ Forbidden cases", () => {
        test("employee + manager.show_shift_status → FORBIDDEN", () => {
            const context: AccessContext = {
                userId: "user1",
                roles: ["EMPLOYEE"],
                contour: "employee",
                scope: "self"
            };

            const decision = resolveACL("manager.show_shift_status", context, TEST_POLICY);

            expect(decision).toEqual({ allowed: false, reason: "FORBIDDEN" });
        });

        test("manager + exec.show_kpi_summary → FORBIDDEN", () => {
            const context: AccessContext = {
                userId: "user2",
                roles: ["MANAGER"],
                contour: "manager",
                scope: "own_unit"
            };

            const decision = resolveACL("exec.show_kpi_summary", context, TEST_POLICY);

            expect(decision).toEqual({ allowed: false, reason: "FORBIDDEN" });
        });

        test("unknown intent (foo.bar) → FORBIDDEN", () => {
            const context: AccessContext = {
                userId: "user1",
                roles: ["EMPLOYEE"],
                contour: "employee",
                scope: "self"
            };

            const decision = resolveACL("foo.bar", context, TEST_POLICY);

            expect(decision).toEqual({ allowed: false, reason: "FORBIDDEN" });
        });
    });

    describe("❌ Out of scope cases", () => {
        test("manager + manager.show_shift_status + self → OUT_OF_SCOPE", () => {
            const context: AccessContext = {
                userId: "user2",
                roles: ["MANAGER"],
                contour: "manager",
                scope: "self" // требуется own_unit
            };

            const decision = resolveACL("manager.show_shift_status", context, TEST_POLICY);

            expect(decision).toEqual({ allowed: false, reason: "OUT_OF_SCOPE" });
        });

        test("exec + manager.show_team_overview + global → OUT_OF_SCOPE", () => {
            const context: AccessContext = {
                userId: "user3",
                roles: ["EXECUTIVE"],
                contour: "exec",
                scope: "global" // разрешён только own_unit для этого intent
            };

            const decision = resolveACL("manager.show_team_overview", context, TEST_POLICY);

            expect(decision).toEqual({ allowed: false, reason: "OUT_OF_SCOPE" });
        });
    });

    describe("🧪 Wildcard matching", () => {
        test("employee.* matches employee.show_my_tasks", () => {
            const context: AccessContext = {
                userId: "user1",
                roles: ["EMPLOYEE"],
                contour: "employee",
                scope: "self"
            };

            const decision = resolveACL("employee.show_my_tasks", context, TEST_POLICY);

            expect(decision).toEqual({ allowed: true });
        });

        test("employee.* matches employee.request_time_off", () => {
            const context: AccessContext = {
                userId: "user1",
                roles: ["EMPLOYEE"],
                contour: "employee",
                scope: "self"
            };

            const decision = resolveACL("employee.request_time_off", context, TEST_POLICY);

            expect(decision).toEqual({ allowed: true });
        });

        test("employeeX.* does NOT match employee.show_my_tasks", () => {
            const context: AccessContext = {
                userId: "user1",
                roles: ["EMPLOYEE"],
                contour: "employee",
                scope: "self"
            };

            // employeeX не существует в policy
            const decision = resolveACL("employeeX.show_my_tasks", context, TEST_POLICY);

            expect(decision).toEqual({ allowed: false, reason: "FORBIDDEN" });
        });

        test("exact intent has priority over wildcard", () => {
            const policyWithExact: ACLPolicy = {
                ...TEST_POLICY,
                exec: [
                    {
                        intent: "manager.show_team_overview", // exact
                        allowedScopes: ["own_unit"]
                    },
                    {
                        intent: "manager.*", // wildcard
                        allowedScopes: ["global"]
                    }
                ]
            };

            const context: AccessContext = {
                userId: "user3",
                roles: ["EXECUTIVE"],
                contour: "exec",
                scope: "own_unit"
            };

            // exact match должен найтись первым
            const decision = resolveACL("manager.show_team_overview", context, policyWithExact);

            expect(decision).toEqual({ allowed: true });
        });
    });
});

import { UserRole, UserStatus } from '../dto/common/common.enums';

export interface User {
    id: string;
    email: string;
    password_hash: string;
    first_name: string;
    last_name: string;
    middle_name?: string;
    phone_number?: string;
    avatar?: string;
    role: UserRole;
    status: UserStatus;
    department_id?: string;
    last_login_at?: Date;
    created_at: Date;
    updated_at: Date;
}

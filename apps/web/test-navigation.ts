
import { getVisibleNavigation, NavItem } from './lib/consulting/navigation-policy';
import { UserRole } from './lib/config/role-config';

function printNav(items: NavItem[], depth = 0) {
    items.forEach(item => {
        console.log(`${'  '.repeat(depth)}[${item.domain}] ${item.label} (${item.path})`);
        if (item.subItems) {
            printNav(item.subItems, depth + 1);
        }
    });
}

console.log('\n=== TESTING ROLE: CEO ===');
const ceoNav = getVisibleNavigation('CEO');
printNav(ceoNav);

console.log('\n=== TESTING ROLE: AGRONOMIST ===');
const agroNav = getVisibleNavigation('AGRONOMIST');
printNav(agroNav);

console.log('\n=== TESTING ROLE: DIRECTOR_FINANCE ===');
const finNav = getVisibleNavigation('DIRECTOR_FINANCE');
printNav(finNav);

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from './ui/Button';
import { EmptyState } from './ui/EmptyState';
import { Icon } from './ui/Icon';
import { colors } from '../theme/colors';
import { spacing, layout } from '../theme/layout';
import { useAuth } from '../context/AuthContext';
import { themedStyles } from '../theme/themedStyles';

export interface UnsupportedRoleScreenProps {
  role: string;
}

/**
 * Shown to accounts that have no mobile app (admin, customer care). They work from the
 * web dashboard, so the only action offered here is signing out.
 */
export const UnsupportedRoleScreen: React.FC<UnsupportedRoleScreenProps> = ({ role }) => {
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const label = role.replace(/_/g, ' ').toLowerCase();

  return (
    <View style={[styles.container, { paddingBottom: spacing.xxl + insets.bottom }]}>
      <EmptyState
        icon="monitor"
        title="Use the web dashboard"
        description={`${label.charAt(0).toUpperCase()}${label.slice(1)} accounts are managed from the METRO-FIX web dashboard. The mobile app is for workers and customers.`}
        action={
          <Button
            title="Sign Out"
            onPress={logout}
            variant="danger"
            size="large"
            icon={<Icon name="log-out" size={17} color={colors.dangerText} />}
          />
        }
      />
    </View>
  );
};

const styles = themedStyles(() => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: layout.screenPadding,
    backgroundColor: 'transparent',
  },
}));

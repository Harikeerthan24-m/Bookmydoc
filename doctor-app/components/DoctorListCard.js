import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import Global_Styles from '../utils/Global_Styles';
import ProfileImage from '../assets/images/doc1.png';

const { Colors, Spacing, Radius } = Global_Styles;

/**
 * Shared row-style doctor card used in Explore and Chat screens.
 *
 * Props:
 *   name      — doctor display name
 *   subtitle  — specialization / expertise
 *   detail    — availability / location string
 *   photoUrl  — optional remote image URI
 *   onPress   — called when card or + button is tapped
 */
const DoctorListCard = ({
  name,
  subtitle,
  detail,
  photoUrl,
  rating,
  experience,
  onPress,
}) => (
  <TouchableOpacity style={styles.item} activeOpacity={0.8} onPress={onPress}>
    <View style={styles.imageContainer}>
      {photoUrl ? (
        <Image style={styles.image} source={{ uri: photoUrl }} />
      ) : (
        <Image style={styles.image} source={ProfileImage} />
      )}
    </View>

    <View style={styles.textContainer}>
      <Text style={styles.name}>{name}</Text>
      {!!subtitle && <Text style={styles.designation}>{subtitle}</Text>}

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <FontAwesome name="star" size={12} color="#FFD700" />
          <Text style={styles.metaText}>{rating || '4.5'}</Text>
        </View>
        <View style={styles.metaItem}>
          <FontAwesome name="calendar" size={11} color="#666" />
          <Text style={styles.metaText}>{experience || '5'} yrs</Text>
        </View>
      </View>

      <View style={styles.bottomRow}>
        {!!detail && (
          <View style={styles.detailBadge}>
            <Text style={styles.detailText}>{detail}</Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.plusButton}
          activeOpacity={0.8}
          onPress={onPress}
        >
          <FontAwesome name="plus" size={16} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  imageContainer: {
    width: 70,
    height: 80,
    borderRadius: Radius.md,
    borderTopRightRadius: 0,
    overflow: 'hidden',
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.sm,
    marginRight: Spacing.md,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  designation: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  detailBadge: {
    flex: 1,
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    marginRight: Spacing.sm,
  },
  detailText: {
    fontSize: 12,
    color: Colors.primary,
  },
  plusButton: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
});

export default DoctorListCard;

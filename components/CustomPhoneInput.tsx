import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Country codes for US and Canada
const COUNTRY_CODES = [
  { code: 'US', dialCode: '+1', flag: '🇺🇸', name: 'United States' },
  { code: 'CA', dialCode: '+1', flag: '🇨🇦', name: 'Canada' },
];

export interface CustomPhoneInputProps {
  defaultValue?: string;
  defaultCode?: 'US' | 'CA';
  onChangeFormattedText: (text: string) => void;
  containerStyle?: object;
  textInputStyle?: object;
  placeholder?: string;
  disabled?: boolean;
}

export interface CustomPhoneInputRef {
  isValidNumber: (phoneNumber: string) => boolean;
  getValue: () => { phoneNumber: string; countryCode: string };
}

const CustomPhoneInput = forwardRef<CustomPhoneInputRef, CustomPhoneInputProps>((props, ref) => {
  const {
    defaultValue = '',
    defaultCode = 'US',
    onChangeFormattedText,
    containerStyle,
    textInputStyle,
    placeholder = 'Phone Number',
    disabled = false,
  } = props;

  const [selectedCountry, setSelectedCountry] = useState(
    COUNTRY_CODES.find(country => country.code === defaultCode) || COUNTRY_CODES[0]
  );
  const [phoneNumber, setPhoneNumber] = useState(defaultValue);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Format phone number with proper spacing
  const formatPhoneNumber = (text: string): string => {
    // Remove all non-numeric characters
    const cleaned = text.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX for US/Canada
    if (cleaned.length > 0) {
      if (cleaned.length <= 3) {
        return cleaned;
      } else if (cleaned.length <= 6) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
      } else {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
      }
    }
    return '';
  };

  // Handle phone number change
  const handlePhoneNumberChange = (text: string) => {
    const formattedNumber = formatPhoneNumber(text);
    setPhoneNumber(formattedNumber);
    
    // Pass the full formatted number with country code to parent
    // For API calls, we want just the digits without formatting
    const cleanedNumber = text.replace(/\D/g, '');
    const fullNumber = `${selectedCountry.dialCode}${cleanedNumber}`;
    onChangeFormattedText(fullNumber);
  };

  // Toggle country dropdown
  const toggleDropdown = () => {
    if (!disabled) {
      setShowDropdown(!showDropdown);
    }
  };

  // Select a country
  const selectCountry = (country: typeof COUNTRY_CODES[0]) => {
    setSelectedCountry(country);
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  // Validate phone number (basic validation for US/Canada)
  const isValidNumber = (number: string): boolean => {
    // Remove all non-numeric characters
    const cleaned = number.replace(/\D/g, '');
    
    // Check if it's a valid US/Canada number (10 digits)
    // This is a simple validation - in a real app, you might want more sophisticated validation
    return cleaned.length === 10 || (cleaned.length === 11 && cleaned.startsWith('1'));
  };

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    isValidNumber: (number: string) => isValidNumber(number),
    getValue: () => ({
      phoneNumber: phoneNumber.replace(/\D/g, ''),
      countryCode: selectedCountry.code,
    }),
  }));

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.inputContainer}>
        {/* Country Code Selector */}
        <TouchableOpacity 
          style={styles.countrySelector} 
          onPress={toggleDropdown}
          disabled={disabled}
        >
          <Text style={styles.flag}>{selectedCountry.flag}</Text>
          <Text style={styles.dialCode}>{selectedCountry.dialCode}</Text>
          <Ionicons 
            name={showDropdown ? "chevron-up" : "chevron-down"} 
            size={16} 
            color="#94a3b8" 
          />
        </TouchableOpacity>

        {/* Phone Number Input */}
        {Platform.OS === 'web' ? (
          <TextInput
            style={[styles.textInput, textInputStyle]}
            value={phoneNumber}
            onChangeText={handlePhoneNumberChange}
            placeholder={placeholder}
            placeholderTextColor="#94a3b8"
            keyboardType="phone-pad"
            editable={!disabled}
          />
        ) : (
          <TextInput
            ref={inputRef}
            style={[styles.textInput, textInputStyle]}
            value={phoneNumber}
            onChangeText={handlePhoneNumberChange}
            placeholder={placeholder}
            placeholderTextColor="#94a3b8"
            keyboardType="phone-pad"
            editable={!disabled}
          />
        )}
      </View>

      {/* Country Dropdown */}
      {showDropdown && (
        <View style={styles.dropdown}>
          {COUNTRY_CODES.map((country) => (
            <TouchableOpacity
              key={country.code}
              style={styles.dropdownItem}
              onPress={() => selectCountry(country)}
            >
              <Text style={styles.flag}>{country.flag}</Text>
              <Text style={styles.countryName}>{country.name}</Text>
              <Text style={styles.dialCode}>{country.dialCode}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#222222',
    overflow: 'hidden',
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRightWidth: 1,
    borderRightColor: '#222222',
  },
  flag: {
    fontSize: 18,
    marginRight: 8,
  },
  dialCode: {
    color: '#ffffff',
    fontSize: 16,
    marginRight: 4,
  },
  textInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  dropdown: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    backgroundColor: '#111111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#222222',
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
  },
  countryName: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    marginLeft: 4,
  },
});

export default CustomPhoneInput;
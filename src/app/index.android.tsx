import { StatusBar } from 'expo-status-bar'
import { useState } from 'react'
import { Alert, Linking, Pressable, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { WebView } from 'react-native-webview'
import html from '../emulator/firmware.generated'

const baseUrl = 'https://badge-emulator.invalid/'
const source = { html, baseUrl }
const claimUrlPattern = /^https:\/\/solana\.com\/breakpoint\/badge\/claim\?[^\s#]+$/

export default function BadgeEmulator() {
  const [boot, setBoot] = useState(0)
  const [claimUrl, setClaimUrl] = useState<string | null>(null)

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#18181b' }}>
      <StatusBar style="light" />
      <WebView
        key={boot}
        source={source}
        style={{ backgroundColor: '#18181b' }}
        originWhitelist={['*']}
        onShouldStartLoadWithRequest={({ url }) => url === baseUrl || url === 'about:blank'}
        onMessage={({ nativeEvent }) => {
          const message = nativeEvent.data
          if (message === 'restart') {
            setClaimUrl(null)
            setBoot((previous) => previous + 1)
          } else if (message.startsWith('claim:')) {
            const url = message.slice('claim:'.length)
            setClaimUrl(claimUrlPattern.test(url) ? url : null)
          }
        }}
        allowFileAccess={false}
        domStorageEnabled
        setSupportMultipleWindows={false}
      />
      {claimUrl && (
        <Pressable
          accessibilityRole="link"
          onPress={() => {
            void Linking.openURL(claimUrl).catch(() => Alert.alert('Could not open the badge link'))
          }}
          style={{ alignItems: 'center', backgroundColor: '#14f195', margin: 12, padding: 14, borderRadius: 8 }}
        >
          <Text style={{ color: '#111313', fontWeight: '700' }}>Link this badge</Text>
        </Pressable>
      )}
    </SafeAreaView>
  )
}

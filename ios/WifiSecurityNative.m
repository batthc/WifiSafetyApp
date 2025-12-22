#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(WifiSecurityNative, NSObject)

RCT_EXTERN_METHOD(getCurrentSecurity:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end

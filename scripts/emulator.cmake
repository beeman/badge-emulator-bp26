# Allow the Android shell to restore the SD card before firmware startup.
function(configure_android_emulator)
    target_link_options(solana-os PRIVATE
        "-sINCOMING_MODULE_JS_API=print,printErr,locateFile,onAbort,preRun")
endfunction()

cmake_language(DEFER CALL configure_android_emulator)

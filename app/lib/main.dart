import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:webview_flutter/webview_flutter.dart';
// Import platform specific implementations if needed for initialization
import 'package:webview_flutter_android/webview_flutter_android.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Set preferred orientations
  SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);
  
  // Set status bar style
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.light,
  ));

  runApp(const VelnoraApp());
}

class VelnoraApp extends StatelessWidget {
  const VelnoraApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Velnora',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFFC8A84B),
          brightness: Brightness.dark,
          background: const Color(0xFF0E0C09),
          surface: const Color(0xFF0E0C09),
        ),
        scaffoldBackgroundColor: const Color(0xFF0E0C09),
      ),
      home: const VelnoraHome(),
    );
  }
}

class VelnoraHome extends StatefulWidget {
  const VelnoraHome({super.key});

  @override
  State<VelnoraHome> createState() => _VelnoraHomeState();
}

class _VelnoraHomeState extends State<VelnoraHome> {
  late final WebViewController _controller;
  bool _isLoading = true;
  double _progress = 0;

  @override
  void initState() {
    super.initState();

    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFF0E0C09))
      ..setNavigationDelegate(
        NavigationDelegate(
          onProgress: (int progress) {
            if (mounted) {
              setState(() {
                _progress = progress / 100;
              });
            }
          },
          onPageStarted: (String url) {
            if (mounted) {
              setState(() {
                _isLoading = true;
              });
            }
          },
          onPageFinished: (String url) {
            if (mounted) {
              setState(() {
                _isLoading = false;
              });
            }
          },
          onWebResourceError: (WebResourceError error) {
            debugPrint('WebResourceError: ${error.description}');
          },
        ),
      )
      ..loadRequest(Uri.parse('https://velnoraai.app/'));

    // Android specific configuration
    final platform = _controller.platform;
    if (platform is AndroidWebViewController) {
      AndroidWebViewController.enableDebugging(true);
      platform.setMediaPlaybackRequiresUserGesture(false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: PopScope(
          canPop: false,
          onPopInvoked: (didPop) async {
            if (didPop) return;
            if (await _controller.canGoBack()) {
              await _controller.goBack();
            } else {
              // Show exit confirmation dialog
              if (mounted) {
                final bool exit = await _showExitDialog(context) ?? false;
                if (exit) {
                  SystemNavigator.pop();
                }
              }
            }
          },
          child: Stack(
            children: [
              WebViewWidget(controller: _controller),
              if (_isLoading)
                Container(
                  color: const Color(0xFF0E0C09),
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(
                          Icons.bolt_rounded,
                          color: Color(0xFFC8A84B),
                          size: 80,
                        ),
                        const SizedBox(height: 24),
                        SizedBox(
                          width: 200,
                          child: LinearProgressIndicator(
                            value: _progress > 0 ? _progress : null,
                            backgroundColor: Colors.white.withOpacity(0.05),
                            valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFFC8A84B)),
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                        const SizedBox(height: 12),
                        const Text(
                          'VELNORA',
                          style: TextStyle(
                            color: Color(0xFFC8A84B),
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 4,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Future<bool?> _showExitDialog(BuildContext context) {
    return showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF14110C),
        title: const Text('Exit Velnora?'),
        content: const Text('Are you sure you want to close the application?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('CANCEL', style: TextStyle(color: Colors.white70)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('EXIT', style: TextStyle(color: Color(0xFFC8A84B), fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}

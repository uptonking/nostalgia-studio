import React, { useEffect, useRef } from 'react';

import { basicSetup, EditorView } from 'codemirror';

import { markdown } from '@codemirror/lang-markdown';
import { ChangeSet, Compartment, Text } from '@codemirror/state';

export const ChangesetLength = () => {
  const content = `import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_dynamic_links/firebase_dynamic_links.dart';
import 'package:flutter/services.dart';
import 'dart:async';

import 'constants/app_constants.dart';
import 'screens/home_screen.dart';
import 'screens/login_screen.dart';
import 'screens/story_generator_screen.dart';
import 'screens/my_stories_screen.dart';
import 'screens/voice_recording_screen.dart';
import 'models/story_model.dart';

/// App router configuration class
class AppRouter {
  // Singleton instance
  static final AppRouter _instance = AppRouter._internal();
  factory AppRouter() => _instance;
  AppRouter._internal();
  
  // Navigation key for accessing navigator without context
  final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();
  
  // Route history management
  final List<String> _routeHistory = [];
  List<String> get routeHistory => List.unmodifiable(_routeHistory);
  
  // Deep link initial route
  String? _initialDeepLinkRoute;
  
  /// Define all app routes
  static const String splash = '/splash';
  static const String login = '/login';
  static const String register = '/register';
  static const String home = '/home';
  static const String storyGenerator = '/story_generator';
  static const String myStories = '/my_stories';
  static const String storyDetails = '/story_details';
  static const String voiceRecording = '/voice_recording';
  static const String settings = '/settings';
  static const String editStory = '/edit_story';
  static const String error = '/error';
  
  /// List of routes that don't require authentication
  final List<String> _publicRoutes = [
    '/',
    splash,
    login,
    register,
    error,
  ];
  
  /// Initialize router and handle deep links
  Future<void> initializeRouter() async {
    // Handle initial deep link
    await _handleInitialDeepLink();
    
    // Listen for dynamic links while app is running
    FirebaseDynamicLinks.instance.onLink.listen(
      (dynamicLinkData) {
        final deepLink = dynamicLinkData.link;
        _handleDynamicLink(deepLink);
      },
      onError: (error) {
        debugPrint('Deep link error: $error');
      },
    );
  }
  
  // Handle initial deep link
  Future<void> _handleInitialDeepLink() async {
    try {
      final PendingDynamicLinkData? data = 
          await FirebaseDynamicLinks.instance.getInitialLink();
          
      if (data != null) {
        final Uri deepLink = data.link;
        _initialDeepLinkRoute = _getRouteFromLink(deepLink);
      }
    } catch (e) {
      debugPrint('Error handling initial deep link: $e');
    }
  }
  
  // Handle dynamic link while app is running
  void _handleDynamicLink(Uri link) {
    final route = _getRouteFromLink(link);
    if (route != null) {
      navigatorKey.currentState?.pushNamed(route, arguments: _getArgumentsFromLink(link));
    }
  }
  
  // Extract route from deep link
  String? _getRouteFromLink(Uri link) {
    // Path format: /path?param1=value1&param2=value2
    final path = link.path;
    
    // Map paths to routes
    switch (path) {
      case '/story':
        return storyDetails;
      case '/create':
        return storyGenerator;
      case '/stories':
        return myStories;
      case '/record':
        return voiceRecording;
      default:
        return home;
    }
  }
  
  // Extract arguments from deep link
  Map<String, dynamic> _getArgumentsFromLink(Uri link) {
    final args = <String, dynamic>{};
    
    // Extract query parameters
    link.queryParameters.forEach((key, value) {
      args[key] = value;
    });
    
    return args;
  }
  
  /// Generate app routes
  Route<dynamic> onGenerateRoute(RouteSettings settings) {
    // Add route to history for back navigation management
    _addRouteToHistory(settings.name);
    
    // Extract arguments if available
    final args = settings.arguments as Map<String, dynamic>? ?? {};
    
    // Check if user is authenticated for protected routes
    if (!_isAuthenticated() && !_isPublicRoute(settings.name ?? '')) {
      // Route requires authentication, redirect to login
      return _buildRoute(
        login,
        const LoginScreen(),
        settings: RouteSettings(
          name: login,
          arguments: {'redirectRoute': settings.name, 'redirectArgs': args},
        ),
      );
    }
    
    // Route generation logic
    switch (settings.name) {
      case '/':
      case home:
        return _buildRoute(home, const HomeScreen(), settings: settings);
        
      case login:
        return _buildRoute(login, const LoginScreen(), settings: settings);
        
      case register:
        return _buildRoute(register, const LoginScreen(initialMode: LoginScreenMode.register), settings: settings);
        
      case storyGenerator:
        final initialKeywords = args['initialKeywords'] as List<String>?;
        return _buildRoute(
          storyGenerator, 
          StoryGeneratorScreen(initialKeywords: initialKeywords),
          settings: settings,
        );
        
      case myStories:
        return _buildRoute(myStories, const MyStoriesScreen(), settings: settings);
        
      case storyDetails:
        final storyId = args['storyId'] as String?;
        final story = args['story'] as Story?;
        
        if (story != null) {
          return _buildRoute(
            storyDetails,
            StoryDetailsScreen(story: story),
            settings: settings,
          );
        } else if (storyId != null) {
          return _buildRoute(
            storyDetails,
            StoryDetailsScreen.fromId(storyId: storyId),
            settings: settings,
          );
        } else {
          return _buildErrorRoute('Missing story information');
        }
        
      case voiceRecording:
        return _buildRoute(
          voiceRecording,
          const VoiceRecordingScreen(),
          settings: settings,
          transitionType: PageTransitionType.rightToLeft,
        );
        
      case editStory:
        final story = args['story'] as Story?;
        if (story != null) {
          return _buildRoute(
            editStory,
            EditStoryScreen(story: story),
            settings: settings,
          );
        } else {
          return _buildErrorRoute('Missing story to edit');
        }
        
      case settings:
        return _buildRoute(
          settings.name!,
          const SettingsScreen(),
          settings: settings,
        );
        
      default:
        return _buildErrorRoute('Route not found: \${settings.name}');
    }
  }
  
  /// Handle unknown routes
  Route<dynamic> onUnknownRoute(RouteSettings settings) {
    return _buildErrorRoute('Route not found: \${settings.name}');
  }
  
  /// Build error page route
  Route<dynamic> _buildErrorRoute(String message) {
    return MaterialPageRoute(
      settings: const RouteSettings(name: error),
      builder: (_) => ErrorScreen(message: message),
    );
  }
  
  /// Check if user is authenticated
  bool _isAuthenticated() {
    return FirebaseAuth.instance.currentUser != null;
  }
  
  /// Check if route is public (doesn't require auth)
  bool _isPublicRoute(String routeName) {
    return _publicRoutes.contains(routeName);
  }
  
  /// Add route to history
  void _addRouteToHistory(String? routeName) {
    if (routeName != null && routeName != '/') {
      _routeHistory.add(routeName);
      // Limit history size
      if (_routeHistory.length > 20) {
        _routeHistory.removeAt(0);
      }
    }
  }
  
  /// Clear route history
  void clearRouteHistory() {
    _routeHistory.clear();
  }
  
  /// Create a share link for a story
  Future<Uri?> createStoryShareLink(String storyId, {String? title}) async {
    try {
      final dynamicLinkParams = DynamicLinkParameters(
        link: Uri.parse('https://aifairytales.app/story?id=$storyId'),
        uriPrefix: 'https://aifairytales.page.link',
        androidParameters: const AndroidParameters(
          packageName: 'com.example.ai_fairy_tales',
          minimumVersion: 1,
        ),
        iosParameters: const IOSParameters(
          bundleId: 'com.example.aiFairyTales',
          minimumVersion: '1.0.0',
        ),
        socialMetaTagParameters: SocialMetaTagParameters(
          title: title ?? 'AI Fairy Tale',
          description: 'Check out this magical story created with AI Fairy Tales!',
          imageUrl: Uri.parse('https://aifairytales.app/images/story_share.png'),
        ),
      );
      
      final shortDynamicLink = await FirebaseDynamicLinks.instance.buildShortLink(
        dynamicLinkParams,
        shortLinkType: ShortDynamicLinkType.unguessable,
      );
      
      return shortDynamicLink.shortUrl;
    } catch (e) {
      debugPrint('Error creating story share link: $e');
      return null;
    }
  }
  
  /// Build route with transition animation
  Route<dynamic> _buildRoute(
    String routeName,
    Widget page, {
    RouteSettings? settings,
    PageTransitionType transitionType = PageTransitionType.fade,
  }) {
    return PageRouteBuilder(
      settings: settings ?? RouteSettings(name: routeName),
      pageBuilder: (context, animation, secondaryAnimation) => page,
      transitionsBuilder: (context, animation, secondaryAnimation, child) {
        return _buildTransition(animation, secondaryAnimation, child, transitionType);
      },
    );
  }
  
  /// Build transition animation based on type
  Widget _buildTransition(
    Animation<double> animation,
    Animation<double> secondaryAnimation,
    Widget child,
    PageTransitionType type,
  ) {
    switch (type) {
      case PageTransitionType.fade:
        return FadeTransition(
          opacity: animation,
          child: child,
        );
        
      case PageTransitionType.rightToLeft:
        return SlideTransition(
          position: Tween<Offset>(
            begin: const Offset(1.0, 0.0),
            end: Offset.zero,
          ).animate(animation),
          child: child,
        );
        
      case PageTransitionType.leftToRight:
        return SlideTransition(
          position: Tween<Offset>(
            begin: const Offset(-1.0, 0.0),
            end: Offset.zero,
          ).animate(animation),
          child: child,
        );
        
      case PageTransitionType.bottomToTop:
        return SlideTransition(
          position: Tween<Offset>(
            begin: const Offset(0.0, 1.0),
            end: Offset.zero,
          ).animate(animation),
          child: child,
        );
        
      case PageTransitionType.scale:
        return ScaleTransition(
          scale: Tween<double>(begin: 0.8, end: 1.0).animate(animation),
          child: FadeTransition(
            opacity: animation,
            child: child,
          ),
        );
        
      case PageTransitionType.rotation:
        return RotationTransition(
          turns: Tween<double>(begin: 0.5, end: 1.0).animate(animation),
          child: ScaleTransition(
            scale: animation,
            child: FadeTransition(
              opacity: animation,
              child: child,
            ),
          ),
        );
    }
  }
  
  /// Get initial route from deep link if available
  String? getInitialRoute() {
    return _initialDeepLinkRoute;
  }
}

/// Enum defining page transition types
enum PageTransitionType {
  fade,
  rightToLeft,
  leftToRight,
  bottomToTop,
  scale,
  rotation,
}

/// Error screen to display when routes fail
class ErrorScreen extends StatelessWidget {
  final String message;
  
  const ErrorScreen({Key? key, required this.message}) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Error'),
        backgroundColor: Colors.red[700],
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.error_outline,
                color: Colors.red,
                size: 60,
              ),
              const SizedBox(height: 16),
              Text(
                'Something went wrong',
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: 16),
              Text(
                message,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () {
                  Navigator.of(context).pushNamedAndRemoveUntil(
                    '/home',
                    (route) => false,
                  );
                },
                child: const Text('Return Home'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Placeholder screens for routes that aren't fully implemented
class StoryDetailsScreen extends StatelessWidget {
  final Story? story;
  final String? storyId;

  const StoryDetailsScreen({Key? key, this.story}) : 
      storyId = null,
      super(key: key);
  
  const StoryDetailsScreen.fromId({Key? key, required this.storyId}) : 
      story = null,
      super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Story Details')),
      body: Center(child: Text(story != null 
          ? 'Story: \${story!.title}'
          : 'Loading story ID: $storyId')),
    );
  }
}

class EditStoryScreen extends StatelessWidget {
  final Story story;
  
  const EditStoryScreen({Key? key, required this.story}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Edit Story')),
      body: Center(child: Text('Editing: \${story.title}')),
    );
  }
}

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: const Center(child: Text('Settings Screen Coming Soon')),
    );
  }
}
</
__file_content__>`;

  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const language = new Compartment();
    const editor = new EditorView({
      extensions: [
        basicSetup,
        // language.of(markdown())
      ],
      doc: content,
      parent: editorRef.current,
    });
    window['edd'] = editor;

    const currentDoc2 = 'hello\nworld';
    const currentDoc = `import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_dynamic_links/firebase_dynamic_links.dart';
import 'package:flutter/services.dart';
import 'dart:async';

import 'constants/app_constants.dart';
import 'screens/home_screen.dart';
import 'screens/login_screen.dart';
import 'screens/story_generator_screen.dart';
import 'screens/my_stories_screen.dart';
import 'screens/voice_recording_screen.dart';
import 'models/story_model.dart';

/// App router configuration class
class AppRouter {
  // Singleton instance
  static final AppRouter _instance = AppRouter._internal();
  factory AppRouter() => _instance;
  AppRouter._internal();
  
  // Navigation key for accessing navigator without context
  final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();
  
  // Route history management
  final List<String> _routeHistory = [];
  List<String> get routeHistory => List.unmodifiable(_routeHistory);
  
  // Deep link initial route
  String? _initialDeepLinkRoute;
  
  /// Define all app routes
  static const String splash = '/splash';
  static const String login = '/login';
  static const String register = '/register';
  static const String home = '/home';
  static const String storyGenerator = '/story_generator';
  static const String myStories = '/my_stories';
  static const String storyDetails = '/story_details';
  static const String voiceRecording = '/voice_recording';
  static const String settings = '/settings';
  static const String editStory = '/edit_story';
  static const String error = '/error';
  
  /// List of routes that don't require authentication
  final List<String> _publicRoutes = [
    '/',
    splash,
    login,
    register,
    error,
  ];
  
  /// Initialize router and handle deep links
  Future<void> initializeRouter() async {
    // Handle initial deep link
    await _handleInitialDeepLink();
    
    // Listen for dynamic links while app is running
    FirebaseDynamicLinks.instance.onLink.listen(
      (dynamicLinkData) {
        final deepLink = dynamicLinkData.link;
        _handleDynamicLink(deepLink);
      },
      onError: (error) {
        debugPrint('Deep link error: $error');
      },
    );
  }
  
  // Handle initial deep link
  Future<void> _handleInitialDeepLink() async {
    try {
      final PendingDynamicLinkData? data = 
          await FirebaseDynamicLinks.instance.getInitialLink();
          
      if (data != null) {
        final Uri deepLink = data.link;
        _initialDeepLinkRoute = _getRouteFromLink(deepLink);
      }
    } catch (e) {
      debugPrint('Error handling initial deep link: $e');
    }
  }
  
  // Handle dynamic link while app is running
  void _handleDynamicLink(Uri link) {
    final route = _getRouteFromLink(link);
    if (route != null) {
      navigatorKey.currentState?.pushNamed(route, arguments: _getArgumentsFromLink(link));
    }
  }
  
  // Extract route from deep link
  String? _getRouteFromLink(Uri link) {
    // Path format: /path?param1=value1&param2=value2
    final path = link.path;
    
    // Map paths to routes
    switch (path) {
      case '/story':
        return storyDetails;
      case '/create':
        return storyGenerator;
      case '/stories':
        return myStories;
      case '/record':
        return voiceRecording;
      default:
        return home;
    }
  }
  
  // Extract arguments from deep link
  Map<String, dynamic> _getArgumentsFromLink(Uri link) {
    final args = <String, dynamic>{};
    
    // Extract query parameters
    link.queryParameters.forEach((key, value) {
      args[key] = value;
    });
    
    return args;
  }
  
  /// Generate app routes
  Route<dynamic> onGenerateRoute(RouteSettings settings) {
    // Add route to history for back navigation management
    _addRouteToHistory(settings.name);
    
    // Extract arguments if available
    final args = settings.arguments as Map<String, dynamic>? ?? {};
    
    // Check if user is authenticated for protected routes
    if (!_isAuthenticated() && !_isPublicRoute(settings.name ?? '')) {
      // Route requires authentication, redirect to login
      return _buildRoute(
        login,
        const LoginScreen(),
        settings: RouteSettings(
          name: login,
          arguments: {'redirectRoute': settings.name, 'redirectArgs': args},
        ),
      );
    }
    
    // Route generation logic
    switch (settings.name) {
      case '/':
      case home:
        return _buildRoute(home, const HomeScreen(), settings: settings);
        
      case login:
        return _buildRoute(login, const LoginScreen(), settings: settings);
        
      case register:
        return _buildRoute(register, const LoginScreen(initialMode: LoginScreenMode.register), settings: settings);
        
      case storyGenerator:
        final initialKeywords = args['initialKeywords'] as List<String>?;
        return _buildRoute(
          storyGenerator, 
          StoryGeneratorScreen(initialKeywords: initialKeywords),
          settings: settings,
        );
        
      case myStories:
        return _buildRoute(myStories, const MyStoriesScreen(), settings: settings);
        
      case storyDetails:
        final storyId = args['storyId'] as String?;
        final story = args['story'] as Story?;
        
        if (story != null) {
          return _buildRoute(
            storyDetails,
            StoryDetailsScreen(story: story),
            settings: settings,
          );
        } else if (storyId != null) {
          return _buildRoute(
            storyDetails,
            StoryDetailsScreen.fromId(storyId: storyId),
            settings: settings,
          );
        } else {
          return _buildErrorRoute('Missing story information');
        }
        
      case voiceRecording:
        return _buildRoute(
          voiceRecording,
          const VoiceRecordingScreen(),
          settings: settings,
          transitionType: PageTransitionType.rightToLeft,
        );
        
      case editStory:
        final story = args['story'] as Story?;
        if (story != null) {
          return _buildRoute(
            editStory,
            EditStoryScreen(story: story),
            settings: settings,
          );
        } else {
          return _buildErrorRoute('Missing story to edit');
        }
        
      case settings:
        return _buildRoute(
          settings.name!,
          const SettingsScreen(),
          settings: settings,
        );
        
      default:
        return _buildErrorRoute('Route not found: \${settings.name}');
    }
  }
  
  /// Handle unknown routes
  Route<dynamic> onUnknownRoute(RouteSettings settings) {
    return _buildErrorRoute('Route not found: \${settings.name}');
  }
  
  /// Build error page route
  Route<dynamic> _buildErrorRoute(String message) {
    return MaterialPageRoute(
      settings: const RouteSettings(name: error),
      builder: (_) => ErrorScreen(message: message),
    );
  }
  
  /// Check if user is authenticated
  bool _isAuthenticated() {
    return FirebaseAuth.instance.currentUser != null;
  }
  
  /// Check if route is public (doesn't require auth)
  bool _isPublicRoute(String routeName) {
    return _publicRoutes.contains(routeName);
  }
  
  /// Add route to history
  void _addRouteToHistory(String? routeName) {
    if (routeName != null && routeName != '/') {
      _routeHistory.add(routeName);
      // Limit history size
      if (_routeHistory.length > 20) {
        _routeHistory.removeAt(0);
      }
    }
  }
  
  /// Clear route history
  void clearRouteHistory() {
    _routeHistory.clear();
  }
  
  /// Create a share link for a story
  Future<Uri?> createStoryShareLink(String storyId, {String? title}) async {
    try {
      final dynamicLinkParams = DynamicLinkParameters(
        link: Uri.parse('https://aifairytales.app/story?id=$storyId'),
        uriPrefix: 'https://aifairytales.page.link',
        androidParameters: const AndroidParameters(
          packageName: 'com.example.ai_fairy_tales',
          minimumVersion: 1,
        ),
        iosParameters: const IOSParameters(
          bundleId: 'com.example.aiFairyTales',
          minimumVersion: '1.0.0',
        ),
        socialMetaTagParameters: SocialMetaTagParameters(
          title: title ?? 'AI Fairy Tale',
          description: 'Check out this magical story created with AI Fairy Tales!',
          imageUrl: Uri.parse('https://aifairytales.app/images/story_share.png'),
        ),
      );
      
      final shortDynamicLink = await FirebaseDynamicLinks.instance.buildShortLink(
        dynamicLinkParams,
        shortLinkType: ShortDynamicLinkType.unguessable,
      );
      
      return shortDynamicLink.shortUrl;
    } catch (e) {
      debugPrint('Error creating story share link: $e');
      return null;
    }
  }
  
  /// Build route with transition animation
  Route<dynamic> _buildRoute(
    String routeName,
    Widget page, {
    RouteSettings? settings,
    PageTransitionType transitionType = PageTransitionType.fade,
  }) {
    return PageRouteBuilder(
      settings: settings ?? RouteSettings(name: routeName),
      pageBuilder: (context, animation,        ).animate(animation),
          child: child,
        );
        
      case PageTransitionType.bottomToTop:
        return SlideTransition(
          position: Tween<Offset>(
            begin: const Offset(0.0, 1.0),
            end: Offset.zero,
          ).animate(animation),
          child: child,
        );
        
      case PageTransitionType.scale:
        return ScaleTransition(
          scale: Tween<double>(begin: 0.8, end: 1.0).animate(animation),
          child: FadeTransition(
            opacity: animation,
            child: child,
          ),
        );
        
      case PageTransitionType.rotation:
        return RotationTransition(
          turns: Tween<double>(begin: 0.5, end: 1.0).animate(animation),
          child: ScaleTransition(
            scale: animation,
            child: FadeTransition(
              opacity: animation,
              child: child,
            ),
          ),
        );
    }
  }
  
  /// Get initial route from deep link if available
  String? ge        style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: 16),
              Text(
                message,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () {
                  Navigator.of(context).pushNamedAndRemoveUntil(
                    '/home',
                    (route) => false,
                  );
                },
                child: const Text('Return Home'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Placeholder screens for routes that aren't fully implemented
class StoryDetailsScreen extends StatelessWidget {
  final Story? story;
  final String? storyId;

  const StoryDetailsScreen({Key? key, this.story}) : 
      storyId = null,
      super(key: key);
  
  const StoryDetailsScreen.fromId({Key? key, required this.storyId}) : 
      story = null,
      super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Story Details')),
      body: Center(child: Text(story != null 
          ? 'Story: \${story!.title}'
          : 'Loading story ID: $storyId')),
    );
  }
}

class EditStoryScreen extends StatelessWidget {
  final Story story;
  
  const EditStoryScreen({Key? key, required this.story}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Edit Story')),
      body: Center(child: Text('Editing: \${story.title}')),
    );
  }
}

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: const Center(child: Text('Settings Screen Coming Soon')),
    );
  }
}
</
__file_content__>
tInitialRoute() {
    return _initialDeepLinkRoute;
  }
}

/// Enum defining page transition types
enum PageTransitionType {
  fade,
  rightToLeft,
  leftToRight,
  bottomToTop,
  scale,
  rotation,
}

/// Error screen to display when routes fail
class ErrorScreen extends StatelessWidget {
  final String message;
  
  const ErrorScreen({Key? key, required this.message}) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Error'),
        backgroundColor: Colors.red[700],
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.error_outline,
                color: Colors.red,
                size: 60,
              ),
              const SizedBox(height: 16),
              Text(
                'Something went wrong',
         secondaryAnimation) => page,
      transitionsBuilder: (context, animation, secondaryAnimation, child) {
        return _buildTransition(animation, secondaryAnimation, child, transitionType);
      },
    );
  }
  
  /// Build transition animation based on type
  Widget _buildTransition(
    Animation<double> animation,
    Animation<double> secondaryAnimation,
    Widget child,
    PageTransitionType type,
  ) {
    switch (type) {
      case PageTransitionType.fade:
        return FadeTransition(
          opacity: animation,
          child: child,
        );
        
      case PageTransitionType.rightToLeft:
        return SlideTransition(
          position: Tween<Offset>(
            begin: const Offset(1.0, 0.0),
            end: Offset.zero,
          ).animate(animation),
          child: child,
        );
        
      case PageTransitionType.leftToRight:
        return SlideTransition(
          position: Tween<Offset>(
            begin: const Offset(-1.0, 0.0),
            end: Offset.zero,
  `;

    const DefaultSplit = /\r\n?|\n/;
    const changes = ChangeSet.fromJSON([
      [currentDoc.length, ...(content?.split(DefaultSplit) || [])],
    ]);
    const updates = [
      {
        agentUserId: 'this.currentAgentUserId',
        changes: changes.toJSON(),
      },
    ];
    const uuid = 'uuidThisId';
    const doc = Text.of(currentDoc.split(DefaultSplit) || []);

    console.log(
      'changeset length',
      changes.length,
      doc.length,
      content.length,
      changes,
    );
    const currentDoc1 = changes.apply(doc).toString();

    return () => {
      editor.destroy();
      window['edd'] = undefined;
    };
  }, [content]);

  return (
    <div className='idCMEditor'>
      <div ref={editorRef} />
    </div>
  );
};

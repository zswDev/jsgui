import org.mozilla.javascript.Context;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;

import ca.weblite.webview.WebView;
import ca.weblite.webview.WebViewCLI;

public class Myjs{
    public static void main(String[] args){

        Context ctx = Context.enter();
        Scriptable scope = ctx.initStandardObjects();

        Object wrappedOut = Context.javaToJS(System.out, scope);

        String jsstr = "var a=1;a";
        Object result = ctx.evaluateString(scope, jsstr, null, 0, null);
        //System.out.print(result);

        ScriptableObject.putProperty(scope, "out", wrappedOut);

        jsstr = "out.print(a);<a><b>123</b></a>";
        result = ctx.evaluateString(scope, jsstr, null, 0, null);
        System.out.print(result);

        
        /*
        String func = "java_cb(111)";
        String job = "<script type='application/javascript'>"+func+"</script>";
        String html = "data:text/html,<html><body>123</body>"+job+"</html>";

        WebView wv = new WebView();

        wv.addJavascriptCallback("java_cb", message -> {

            System.out.print(message);

            new Thread(() -> {
                wv.dispatch( ()-> {
                    wv.eval("document.write(333)");
                });
            }).start();

        });

        wv.url(html);
        wv.show();*/
    }
}
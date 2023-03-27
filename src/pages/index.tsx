import Layout from "@/components/pages";
import HomePage from "@/components/pages/home";
import { WithRouterProps } from "next/dist/client/with-router";
import { useEffect } from 'react';

interface PageProps extends WithRouterProps {}

const App: React.FC<PageProps> = (props) => {
  useEffect(() => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(registration =>
        console.log(
          'Service Worker registration successful with scope: ',
          registration.scope
        )
      )
      .catch((err) => console.log('Service Worker registration failed: ', err))
  }, []);
  return (
    <Layout>
      <HomePage {...props} />
    </Layout>
  );
};

export default App;

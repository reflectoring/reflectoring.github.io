mkdir istio && cd istio
curl -L https://istio.io/downloadIstio | sh -
export PATH=$PWD/istio-1.7.2/bin/:$PATH
istioctl install --set profile=demo
kubectl label namespace default istio-injection=enabled
kubectl describe label default


